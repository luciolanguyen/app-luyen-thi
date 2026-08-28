/**
 * Kiểm chứng toàn bộ schema + seed bằng PGlite (Postgres biên dịch sang WASM).
 * Không cần Docker, không cần Supabase — chạy được ở mọi máy có Node.
 *
 *   node scripts/verify-sql.mjs
 *
 * PGlite không có schema `auth` của Supabase, nên script tự dựng một bản tối
 * giản (auth.users + auth.uid) để các migration chạy được y như trên Supabase.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MIGRATIONS = [
  "supabase/migrations/20260827000001_schema.sql",
  "supabase/migrations/20260827000002_rls_and_functions.sql",
  "supabase/migrations/20260827000003_analytics.sql",
  "supabase/migrations/20260827000004_question_bank_counts.sql",
  "supabase/migrations/20260827000005_fix_practice_reveal.sql",
  "supabase/migrations/20260827000006_save_answer_returns_explanation.sql",
  "supabase/migrations/20260827000007_fix_performance_by_type.sql",
  "supabase/migrations/20260827000008_update_exam_matrix.sql",
];

const SEEDS = [
  "supabase/seed/01_taxonomy_config.sql",
  "supabase/seed/02_questions_exam_types.sql",
  "supabase/seed/03_questions_cloze_reading.sql",
  "supabase/seed/04_questions_grammar_vocab.sql",
  "supabase/seed/05_sample_exam.sql",
];

/** Bản tối giản của phần Supabase cung cấp sẵn trên môi trường thật. */
const SUPABASE_STUB = `
create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- auth.uid() thật đọc từ JWT; ở đây đọc từ một biến phiên để test đổi vai được.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('test.current_user_id', true), '')::uuid;
$$;

create role authenticated;
`;

let pass = 0;
let fail = 0;

function ok(msg) {
  pass++;
  console.log(`  \x1b[32mPASS\x1b[0m  ${msg}`);
}
function bad(msg, err) {
  fail++;
  console.log(`  \x1b[31mFAIL\x1b[0m  ${msg}`);
  if (err) console.log(`        ${String(err.message || err).split("\n")[0]}`);
}

async function run(db, file) {
  const sql = await readFile(join(ROOT, file), "utf8");
  await db.exec(sql);
}

/** Đóng vai một người dùng cụ thể để auth.uid() trả về đúng id. */
async function actAs(db, userId) {
  await db.exec(
    `select set_config('test.current_user_id', ${
      userId ? `'${userId}'` : "''"
    }, false);`
  );
}

const db = new PGlite();

console.log("\n=== 1. Dựng schema ===");
try {
  await db.exec(SUPABASE_STUB);
  ok("stub auth schema");
} catch (e) {
  bad("stub auth schema", e);
  process.exit(1);
}

for (const m of MIGRATIONS) {
  try {
    await run(db, m);
    ok(m.split("/").pop());
  } catch (e) {
    bad(m.split("/").pop(), e);
  }
}

console.log("\n=== 2. Nạp dữ liệu mẫu ===");
for (const s of SEEDS) {
  try {
    await run(db, s);
    ok(s.split("/").pop());
  } catch (e) {
    bad(s.split("/").pop(), e);
  }
}

console.log("\n=== 3. Kiểm tra ngân hàng câu hỏi ===");
try {
  const { rows } = await db.query(`
    select qt.name_vi, count(q.id)::int as n
      from question_types qt left join questions q on q.type_id = qt.id
     group by qt.id, qt.name_vi, qt.sort_order order by qt.sort_order`);
  const total = rows.reduce((a, r) => a + r.n, 0);
  for (const r of rows) console.log(`        ${String(r.n).padStart(3)}  ${r.name_vi}`);
  if (total > 0) ok(`tổng ${total} câu hỏi`);
  else bad("ngân hàng câu hỏi rỗng");

  // Mọi câu phải có đúng 4 phương án và correct_key nằm trong số đó
  const { rows: bad4 } = await db.query(`
    select count(*)::int as n from questions
     where jsonb_array_length(options) <> 4`);
  bad4[0].n === 0
    ? ok("mọi câu đều có đúng 4 phương án")
    : bad(`${bad4[0].n} câu không có đúng 4 phương án`);

  const { rows: badKey } = await db.query(`
    select count(*)::int as n from questions q
     where not exists (
       select 1 from jsonb_array_elements(q.options) o
        where o->>'key' = q.correct_key)`);
  badKey[0].n === 0
    ? ok("correct_key của mọi câu đều khớp một phương án")
    : bad(`${badKey[0].n} câu có correct_key không khớp phương án nào`);

  const { rows: noExp } = await db.query(`
    select count(*)::int as n from questions where coalesce(explanation,'') = ''`);
  noExp[0].n === 0
    ? ok("mọi câu đều có giải thích")
    : bad(`${noExp[0].n} câu thiếu giải thích`);
} catch (e) {
  bad("kiểm tra ngân hàng câu hỏi", e);
}

console.log("\n=== 4. Kiểm tra đề thi thử ===");
try {
  const { rows } = await db.query(`
    select count(*)::int as n from exam_questions
     where exam_id = '22222222-2222-4222-8222-222222222222'`);
  rows[0].n === 40
    ? ok("đề mẫu có đúng 40 câu")
    : bad(`đề mẫu có ${rows[0].n} câu, cần 40`);

  const { rows: mx } = await db.query(`
    select em.total_questions,
           (select coalesce(sum(question_count),0) from exam_matrix_items where matrix_id = em.id)::int as summed
      from exam_matrices em where em.is_default`);
  mx[0].summed === mx[0].total_questions
    ? ok(`ma trận cộng đủ ${mx[0].total_questions} câu`)
    : bad(`ma trận cộng được ${mx[0].summed}, khai báo ${mx[0].total_questions}`);
} catch (e) {
  bad("kiểm tra đề thi thử", e);
}

console.log("\n=== 5. Chạy thử một lượt thi trọn vẹn ===");
try {
  const { rows: u } = await db.query(
    `insert into auth.users (email, raw_user_meta_data)
     values ('hs@test.vn', '{"full_name":"Trần Thu Hà"}'::jsonb) returning id`
  );
  const uid = u[0].id;
  await actAs(db, uid);

  const { rows: p } = await db.query(`select full_name, role from profiles where id = $1`, [uid]);
  p[0]?.full_name === "Trần Thu Hà" && p[0]?.role === "student"
    ? ok("trigger tự tạo hồ sơ khi đăng ký")
    : bad(`hồ sơ sai: ${JSON.stringify(p[0])}`);

  const { rows: a } = await db.query(
    `select start_exam_attempt('22222222-2222-4222-8222-222222222222') as id`
  );
  const attemptId = a[0].id;
  ok("bắt đầu lượt thi");

  // Đồng hồ phải do server đặt, đúng 3000 giây
  const { rows: dl } = await db.query(
    `select extract(epoch from (deadline_at - started_at))::int as secs from attempts where id = $1`,
    [attemptId]
  );
  dl[0].secs === 3000
    ? ok("server đặt hạn nộp đúng 50 phút")
    : bad(`hạn nộp = ${dl[0].secs}s, cần 3000s`);

  // ĐANG THI: không được lộ đáp án
  const { rows: hidden } = await db.query(
    `select count(*)::int as leaked from get_attempt_questions($1) where correct_key is not null`,
    [attemptId]
  );
  hidden[0].leaked === 0
    ? ok("đang thi: đáp án được giấu hoàn toàn")
    : bad(`đang thi mà lộ ${hidden[0].leaked} đáp án`);

  // Trả lời đúng 30 câu, sai 10 câu (lấy đáp án từ bảng gốc để mô phỏng)
  const { rows: keys } = await db.query(
    `select aa.position, q.correct_key
       from attempt_answers aa join questions q on q.id = aa.question_id
      where aa.attempt_id = $1 order by aa.position`,
    [attemptId]
  );
  for (const { position, correct_key } of keys) {
    const wrong = ["A", "B", "C", "D"].find((k) => k !== correct_key);
    const pick = position <= 30 ? correct_key : wrong;
    await db.query(`select save_answer($1, $2::smallint, $3, 4000)`, [
      attemptId,
      position,
      pick,
    ]);
  }
  ok("lưu 40 đáp án");

  const { rows: sub } = await db.query(`select submit_attempt($1) as r`, [attemptId]);
  const r = sub[0].r;
  r.correct_count === 30
    ? ok("chấm đúng 30/40 câu")
    : bad(`chấm được ${r.correct_count}/40, cần 30`);
  Number(r.score) === 7.5
    ? ok("điểm = 7,50 (30 × 0,25)")
    : bad(`điểm = ${r.score}, cần 7.50`);
  r.points_earned === 50
    ? ok("cộng 50 điểm thưởng theo point_rules")
    : bad(`cộng ${r.points_earned} điểm, cần 50`);

  // SAU KHI NỘP: đáp án và giải thích phải hiện ra
  const { rows: shown } = await db.query(
    `select count(*)::int as n from get_attempt_questions($1) where correct_key is not null`,
    [attemptId]
  );
  shown[0].n === 40
    ? ok("sau khi nộp: hiện đủ 40 đáp án kèm giải thích")
    : bad(`sau khi nộp chỉ hiện ${shown[0].n}/40 đáp án`);

  // Nộp lại lần nữa không được chấm lại hay cộng điểm lần hai
  const { rows: again } = await db.query(`select submit_attempt($1) as r`, [attemptId]);
  again[0].r.already_submitted === true
    ? ok("nộp lại lần hai không chấm lại")
    : bad("nộp lại lần hai vẫn chấm lại — sẽ cộng điểm trùng");

  const { rows: bal } = await db.query(`select my_points_balance() as b`);
  ok(`số dư điểm thưởng: ${bal[0].b}`);

  const { rows: st } = await db.query(`select current_streak from streaks where user_id = $1`, [uid]);
  st[0].current_streak === 1
    ? ok("streak lên 1 sau ngày luyện đầu tiên")
    : bad(`streak = ${st[0].current_streak}, cần 1`);

  const { rows: bg } = await db.query(
    `select b.name_vi from user_badges ub join badges b on b.id = ub.badge_id where ub.user_id = $1 order by b.sort_order`,
    [uid]
  );
  bg.length > 0
    ? ok(`trao huy hiệu: ${bg.map((x) => x.name_vi).join(", ")}`)
    : bad("không trao huy hiệu nào dù đã làm 40 câu");
} catch (e) {
  bad("luồng thi thử", e);
}

console.log("\n=== 6. Kiểm tra báo cáo & xếp hạng ===");
try {
  const { rows: ov } = await db.query(`select my_overview() as o`);
  const o = ov[0].o;
  Number(o.avg_score) === 7.5 && o.questions_done === 40
    ? ok(`tổng quan: TB ${o.avg_score}, ${o.questions_done} câu, đúng ${o.accuracy}%`)
    : bad(`tổng quan sai: ${JSON.stringify(o)}`);

  const { rows: bt } = await db.query(`select * from my_performance_by_type() where answered > 0`);
  bt.length === 4
    ? ok("năng lực theo 4 dạng bài của đề thật")
    : bad(`chỉ có ${bt.length} dạng bài có dữ liệu, cần 4`);

  const { rows: lb } = await db.query(`select * from leaderboard('exam_score','all')`);
  lb.length === 1 && Number(lb[0].value) === 7.5
    ? ok(`bảng xếp hạng: hạng ${lb[0].rank}, ${lb[0].display_name}, ${lb[0].value} điểm`)
    : bad(`xếp hạng sai: ${JSON.stringify(lb)}`);

  // Bật ẩn danh thì tên phải biến mất khỏi bảng công khai
  await db.exec(`update profiles set leaderboard_anonymous = true`);
  const { rows: anon } = await db.query(`select display_name from leaderboard('exam_score','all')`);
  anon[0].display_name === "Ẩn danh"
    ? ok("tuỳ chọn ẩn danh che được tên thật")
    : bad(`ẩn danh không hoạt động: ${anon[0].display_name}`);

  const { rows: sp } = await db.query(`select * from my_study_plan()`);
  sp.length > 0
    ? ok(`gợi ý lộ trình: ${sp.map((x) => x.label).join(" · ")}`)
    : bad("không sinh được gợi ý lộ trình");
} catch (e) {
  bad("báo cáo & xếp hạng", e);
}

console.log("\n=== 7. Luyện tự do: lộ đáp án theo từng câu ===");
try {
  // Lỗi từng gặp: mở phiên luyện tự do là lộ sẵn đáp án CẢ 10 CÂU trước khi
  // học sinh trả lời. Đáp án chỉ được hiện ra ở câu ĐÃ trả lời.
  const { rows: u3 } = await db.query(
    `insert into auth.users (email, raw_user_meta_data)
     values ('hs3@test.vn', '{"full_name":"Phạm Anh"}'::jsonb) returning id`
  );
  await actAs(db, u3[0].id);

  const { rows: ps } = await db.query(
    `select start_practice_session(5::smallint, null, null, 10::smallint, false) as id`
  );
  const pid = ps[0].id;

  const { rows: fresh } = await db.query(
    `select count(*) filter (where correct_key is not null)::int as leaked,
            count(*)::int as total
       from get_attempt_questions($1)`,
    [pid]
  );
  fresh[0].leaked === 0
    ? ok(`phiên mới mở: 0/${fresh[0].total} câu lộ đáp án`)
    : bad(`phiên mới mở đã lộ ${fresh[0].leaked}/${fresh[0].total} đáp án`);

  // Trả lời câu 1 -> chỉ câu 1 được lộ
  const { rows: k1 } = await db.query(
    `select q.correct_key from attempt_answers aa join questions q on q.id = aa.question_id
      where aa.attempt_id = $1 and aa.position = 1`,
    [pid]
  );
  const { rows: sa } = await db.query(
    `select save_answer($1, 1::smallint, $2, 3000) as r`,
    [pid, k1[0].correct_key]
  );
  sa[0].r.revealed === true && sa[0].r.is_correct === true
    ? ok("trả lời đúng: server chấm và trả kết quả ngay")
    : bad(`save_answer trả về sai: ${JSON.stringify(sa[0].r)}`);

  const { rows: after } = await db.query(
    `select count(*) filter (where correct_key is not null)::int as shown
       from get_attempt_questions($1)`,
    [pid]
  );
  after[0].shown === 1
    ? ok("sau khi trả lời câu 1: đúng 1 câu được lộ, 9 câu còn giấu")
    : bad(`lộ ${after[0].shown} câu, cần đúng 1`);

  await db.query(`select submit_attempt($1)`, [pid]);
  const { rows: done } = await db.query(
    `select count(*) filter (where correct_key is not null)::int as shown
       from get_attempt_questions($1)`,
    [pid]
  );
  done[0].shown === 10
    ? ok("sau khi nộp: lộ đủ 10 câu")
    : bad(`sau khi nộp chỉ lộ ${done[0].shown}/10`);

  // Luyện tính giờ thì tuyệt đối không lộ dù đã trả lời
  const { rows: pt } = await db.query(
    `select start_practice_session(6::smallint, null, null, 10::smallint, true) as id`
  );
  const tid = pt[0].id;
  const { rows: tk } = await db.query(
    `select q.correct_key from attempt_answers aa join questions q on q.id = aa.question_id
      where aa.attempt_id = $1 and aa.position = 1`,
    [tid]
  );
  const { rows: ts } = await db.query(
    `select save_answer($1, 1::smallint, $2, 3000) as r`,
    [tid, tk[0].correct_key]
  );
  const { rows: tq } = await db.query(
    `select count(*) filter (where correct_key is not null)::int as leaked
       from get_attempt_questions($1)`,
    [tid]
  );
  ts[0].r.revealed === false && tq[0].leaked === 0
    ? ok("luyện tính giờ: không lộ đáp án dù đã trả lời")
    : bad(`luyện tính giờ bị lộ: revealed=${ts[0].r.revealed}, leaked=${tq[0].leaked}`);
} catch (e) {
  bad("luyện tự do", e);
}

console.log("\n=== 8. Thống kê chỉ tính bài của mình, đã nộp ===");
try {
  // Lỗi từng gặp: my_performance_by_type có mệnh đề `where a.id is not null
  // or true` — `or true` vô hiệu hoá bộ lọc, nên LEFT JOIN giữ lại cả lượt
  // đang làm dở. Hậu quả: trang tổng quan và bảng theo dạng bài vênh nhau.
  const { rows: u4 } = await db.query(
    `insert into auth.users (email, raw_user_meta_data)
     values ('hs4@test.vn', '{"full_name":"Đỗ Bình"}'::jsonb) returning id`
  );
  await actAs(db, u4[0].id);

  // Một phiên ĐÃ NỘP với 2 câu đúng
  const { rows: fin } = await db.query(
    `select start_practice_session(5::smallint, null, null, 10::smallint, false) as id`
  );
  for (const pos of [1, 2]) {
    const { rows: k } = await db.query(
      `select q.correct_key from attempt_answers aa join questions q on q.id = aa.question_id
        where aa.attempt_id = $1 and aa.position = $2`,
      [fin[0].id, pos]
    );
    await db.query(`select save_answer($1, $2::smallint, $3, 2000)`, [
      fin[0].id,
      pos,
      k[0].correct_key,
    ]);
  }
  await db.query(`select submit_attempt($1)`, [fin[0].id]);

  // Một phiên BỎ DỞ với 3 câu đúng — không được tính vào thống kê
  const { rows: open } = await db.query(
    `select start_practice_session(5::smallint, null, null, 10::smallint, false) as id`
  );
  for (const pos of [1, 2, 3]) {
    const { rows: k } = await db.query(
      `select q.correct_key from attempt_answers aa join questions q on q.id = aa.question_id
        where aa.attempt_id = $1 and aa.position = $2`,
      [open[0].id, pos]
    );
    await db.query(`select save_answer($1, $2::smallint, $3, 2000)`, [
      open[0].id,
      pos,
      k[0].correct_key,
    ]);
  }

  const { rows: bt } = await db.query(
    `select answered from my_performance_by_type() where type_id = 5`
  );
  Number(bt[0].answered) === 2
    ? ok("bài đang làm dở KHÔNG bị tính vào thống kê dạng bài")
    : bad(`đếm ${bt[0].answered} câu, cần 2 — bài bỏ dở bị tính nhầm`);

  const { rows: ov2 } = await db.query(`select my_overview() as o`);
  Number(ov2[0].o.questions_done) === Number(bt[0].answered)
    ? ok(`tổng quan khớp bảng dạng bài: cùng ${bt[0].answered} câu`)
    : bad(
        `vênh nhau: tổng quan ${ov2[0].o.questions_done} vs dạng bài ${bt[0].answered}`
      );

  // Dữ liệu của học sinh khác (đã tạo ở các mục trên) không được lẫn vào
  const { rows: mine } = await db.query(
    `select coalesce(sum(answered),0)::int as n from my_performance_by_type()`
  );
  mine[0].n === 2
    ? ok("thống kê không lẫn dữ liệu của học sinh khác")
    : bad(`tổng ${mine[0].n} câu, cần đúng 2 của riêng mình`);
} catch (e) {
  bad("thống kê", e);
}

console.log("\n=== 9. Sửa ma trận đề (all-or-nothing) ===");
try {
  const MATRIX = "11111111-1111-4111-8111-111111111111";

  // Học sinh thường KHÔNG được sửa ma trận
  let blocked = false;
  try {
    await db.query(
      `select update_exam_matrix($1, 3000, 0.25,
         '[{"type_id":1,"question_count":40}]'::jsonb)`,
      [MATRIX]
    );
  } catch {
    blocked = true;
  }
  blocked
    ? ok("học sinh không sửa được ma trận đề")
    : bad("học sinh sửa được ma trận đề — thiếu kiểm tra quyền");

  // Nâng quyền để test tiếp
  const { rows: adm } = await db.query(
    `insert into auth.users (email, raw_user_meta_data)
     values ('admin@test.vn', '{"full_name":"Quản Trị"}'::jsonb) returning id`
  );
  await db.query(`update profiles set role = 'admin' where id = $1`, [adm[0].id]);
  await actAs(db, adm[0].id);

  // Lỗi từng gặp: đổi phân bổ (dạng 1 tăng, dạng 4 giảm bù lại) khiến tổng
  // CHẠM 42 giữa chừng và bị trigger chặn, dù kết quả cuối vẫn là 40.
  const { rows: upd } = await db.query(
    `select update_exam_matrix($1, 3300, 0.25,
       '[{"type_id":1,"question_count":6},{"type_id":2,"question_count":5},
         {"type_id":3,"question_count":10},{"type_id":4,"question_count":19}]'::jsonb) as r`,
    [MATRIX]
  );
  Number(upd[0].r.total_questions) === 40
    ? ok("đổi phân bổ giữ nguyên tổng 40 — không bị trigger chặn oan")
    : bad(`tổng sau khi sửa = ${upd[0].r.total_questions}, cần 40`);

  const { rows: chk } = await db.query(
    `select duration_seconds, max_score,
            (select string_agg(type_id||':'||question_count, ' ' order by type_id)
               from exam_matrix_items where matrix_id = $1) as mix
       from exam_matrices where id = $1`,
    [MATRIX]
  );
  chk[0].duration_seconds === 3300 && chk[0].mix === "1:6 2:5 3:10 4:19"
    ? ok(`lưu đúng: 55 phút, phân bổ ${chk[0].mix}`)
    : bad(`lưu sai: ${JSON.stringify(chk[0])}`);

  // Đặt một dạng bài về 0 thì dòng đó phải bị xoá khỏi ma trận
  await db.query(
    `select update_exam_matrix($1, 3000, 0.25,
       '[{"type_id":1,"question_count":4},{"type_id":2,"question_count":0},
         {"type_id":3,"question_count":15},{"type_id":4,"question_count":21}]'::jsonb)`,
    [MATRIX]
  );
  const { rows: gone } = await db.query(
    `select count(*)::int as n from exam_matrix_items
      where matrix_id = $1 and type_id = 2`,
    [MATRIX]
  );
  gone[0].n === 0
    ? ok("đặt số câu về 0 thì dạng bài bị gỡ khỏi ma trận")
    : bad("dạng bài đặt về 0 vẫn còn trong ma trận");

  // Thời gian ngoài khoảng cho phép phải bị từ chối
  let rejected = false;
  try {
    await db.query(
      `select update_exam_matrix($1, 60, 0.25,
         '[{"type_id":1,"question_count":40}]'::jsonb)`,
      [MATRIX]
    );
  } catch {
    rejected = true;
  }
  rejected
    ? ok("từ chối thời gian làm bài dưới 5 phút")
    : bad("chấp nhận thời gian làm bài phi lý");
} catch (e) {
  bad("sửa ma trận đề", e);
}

console.log("\n=== 10. Kiểm tra bảo mật ===");
try {
  // Người dùng B không được xem bài của người dùng A
  const { rows: u2 } = await db.query(
    `insert into auth.users (email, raw_user_meta_data)
     values ('hs2@test.vn', '{"full_name":"Lê Minh"}'::jsonb) returning id`
  );
  const { rows: att } = await db.query(
    `select id from attempts limit 1`
  );
  await actAs(db, u2[0].id);
  let blocked = false;
  try {
    await db.query(`select * from get_attempt_questions($1)`, [att[0].id]);
  } catch {
    blocked = true;
  }
  blocked
    ? ok("học sinh khác KHÔNG xem được bài làm của bạn")
    : bad("rò rỉ: học sinh khác xem được bài làm của người khác");

  // Hết giờ thì không nhận thêm đáp án
  await actAs(db, u2[0].id);
  const { rows: a3 } = await db.query(
    `select start_exam_attempt('22222222-2222-4222-8222-222222222222') as id`
  );
  await db.query(`update attempts set deadline_at = now() - interval '1 minute' where id = $1`, [
    a3[0].id,
  ]);
  let rejected = false;
  try {
    await db.query(`select save_answer($1, 1::smallint, 'A', 1000)`, [a3[0].id]);
  } catch {
    rejected = true;
  }
  rejected
    ? ok("hết giờ thì từ chối nhận đáp án mới")
    : bad("vẫn nhận đáp án sau khi hết giờ");

  const { rows: exp } = await db.query(`select submit_attempt($1) as r`, [a3[0].id]);
  exp[0].r.expired === true
    ? ok("bài nộp sau hạn được đánh dấu quá giờ")
    : bad("không đánh dấu bài quá giờ");
} catch (e) {
  bad("kiểm tra bảo mật", e);
}

console.log(
  `\n${"─".repeat(56)}\n  ${pass} PASS · ${fail} FAIL\n${"─".repeat(56)}\n`
);
await db.close();
process.exit(fail > 0 ? 1 : 0);
