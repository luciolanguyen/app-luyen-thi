-- ============================================================================
-- DỮ LIỆU NỀN: phân loại, ma trận đề, quy tắc điểm, huy hiệu
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 6 DANH MỤC LUYỆN TẬP = 4 dạng bài của đề thật + 2 danh mục bổ trợ
-- ---------------------------------------------------------------------------
insert into question_types (id, code, name_vi, description, in_real_exam, sort_order) values
  (1, 'notice',   'Điền từ/câu vào thông báo, quảng cáo',
      'Đọc biển hiệu, tờ rơi, thông báo ngắn và chọn từ/câu phù hợp với ngữ cảnh.', true, 1),
  (2, 'ordering', 'Sắp xếp câu/đoạn hội thoại',
      'Đưa các câu rời rạc về đúng trật tự để tạo thành hội thoại hoặc đoạn văn mạch lạc.', true, 2),
  (3, 'cloze',    'Hoàn thành đoạn văn (Cloze test)',
      'Điền từ vào chỗ trống trong một đoạn văn, kiểm tra từ vựng và ngữ pháp trong ngữ cảnh.', true, 3),
  (4, 'reading',  'Đọc hiểu',
      'Tìm ý chính, suy luận, paraphrase, từ đồng nghĩa/trái nghĩa, tham chiếu đại từ, quan điểm tác giả.', true, 4),
  (5, 'grammar',  'Ngữ pháp trọng tâm lớp 12',
      'Luyện riêng từng chuyên đề ngữ pháp trọng tâm của chương trình GDPT 2018.', false, 5),
  (6, 'vocab',    'Từ vựng theo chủ đề',
      'Mở rộng vốn từ theo chủ đề, phổ A2–C1 như trong đề thi.', false, 6);

-- ---------------------------------------------------------------------------
-- CHUYÊN ĐỀ NGỮ PHÁP (trọng tâm lớp 12 nêu trong spec mục 0)
-- ---------------------------------------------------------------------------
insert into topics (code, name_vi, kind, sort_order) values
  ('conditional_1',    'Câu điều kiện loại 1',            'grammar', 1),
  ('double_comparison','So sánh kép (double comparison)', 'grammar', 2),
  ('causative_passive','Thể bị động nguyên nhân (causative passive)', 'grammar', 3),
  ('relative_clause',  'Mệnh đề quan hệ',                 'grammar', 4),
  ('reported_speech',  'Câu tường thuật',                 'grammar', 5),
  ('conjunctions',     'Liên từ & từ nối',                'grammar', 6),
  ('phrasal_verbs',    'Cụm động từ (phrasal verbs)',     'grammar', 7),
  ('passive_voice',    'Câu bị động',                     'grammar', 8),
  ('articles_preps',   'Mạo từ & giới từ',                'grammar', 9),
  ('word_forms',       'Cấu tạo từ (word formation)',     'grammar', 10);

insert into topics (code, name_vi, kind, sort_order) values
  ('env',       'Môi trường',        'vocab', 21),
  ('tech',      'Công nghệ',         'vocab', 22),
  ('education', 'Giáo dục',          'vocab', 23),
  ('health',    'Sức khoẻ',          'vocab', 24),
  ('culture',   'Văn hoá & xã hội',  'vocab', 25),
  ('career',    'Nghề nghiệp',       'vocab', 26);

-- ---------------------------------------------------------------------------
-- MA TRẬN ĐỀ THI MẶC ĐỊNH
-- Theo Quyết định 4068/QĐ-BGDĐT: 40 câu / 50 phút / 0,25đ mỗi câu / tối đa 10đ.
--
-- ⚠️ SỐ CÂU MỖI DẠNG dưới đây là ĐIỂM KHỞI ĐIỂM, không phải con số chính thức.
-- Spec (mục 0 và mục 7) yêu cầu đối chiếu với đề minh hoạ Bộ GD&ĐT công bố hằng
-- năm. Admin sửa trực tiếp trong trang Quản trị > Ma trận đề, không cần đụng code.
-- ---------------------------------------------------------------------------
insert into exam_matrices (id, name, description, total_questions, duration_seconds,
                           points_per_question, max_score, is_default, is_active)
values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Ma trận chuẩn THPT 2026',
  'Bám cấu trúc đề áp dụng từ 2025 (QĐ 4068/QĐ-BGDĐT). Cần đối chiếu lại số câu mỗi dạng với đề minh hoạ mới nhất.',
  40, 3000, 0.25, 10.00, true, true
);

insert into exam_matrix_items (matrix_id, type_id, question_count, difficulty_mix, sort_order) values
  ('11111111-1111-4111-8111-111111111111'::uuid, 1,  4,
   '{"nhan_biet":2,"thong_hieu":2}'::jsonb, 1),
  ('11111111-1111-4111-8111-111111111111'::uuid, 2,  5,
   '{"nhan_biet":1,"thong_hieu":3,"van_dung":1}'::jsonb, 2),
  ('11111111-1111-4111-8111-111111111111'::uuid, 3, 10,
   '{"nhan_biet":2,"thong_hieu":5,"van_dung":3}'::jsonb, 3),
  ('11111111-1111-4111-8111-111111111111'::uuid, 4, 21,
   '{"nhan_biet":3,"thong_hieu":8,"van_dung":7,"van_dung_cao":3}'::jsonb, 4);

-- ---------------------------------------------------------------------------
-- QUY TẮC CỘNG ĐIỂM (spec 4.6) — admin chỉnh số, không sửa code
-- ---------------------------------------------------------------------------
insert into point_rules (code, name_vi, points) values
  ('complete_practice', 'Hoàn thành một phiên luyện tập',        20),
  ('complete_exam',     'Hoàn thành một bài thi thử',            50),
  ('exam_score_8plus',  'Thi thử đạt từ 8,0 điểm',               30),
  ('exam_score_9plus',  'Thi thử đạt từ 9,0 điểm',               80),
  ('streak_7',          'Duy trì chuỗi 7 ngày',                  50),
  ('streak_30',         'Duy trì chuỗi 30 ngày',                300),
  ('streak_100',        'Duy trì chuỗi 100 ngày',              1200),
  ('daily_login',       'Đăng nhập mỗi ngày',                     5),
  ('referral',          'Mời được một bạn tham gia',            100);

-- ---------------------------------------------------------------------------
-- HUY HIỆU (spec 4.4)
-- ---------------------------------------------------------------------------
insert into badges (code, name_vi, description, icon, criteria, points_reward, sort_order) values
  ('first_steps',    'Bước đầu tiên',    'Trả lời 10 câu hỏi đầu tiên.',
   'footprints', '{"kind":"questions_answered","threshold":10}', 20, 1),
  ('century',        'Trăm câu đầu tiên','Trả lời 100 câu hỏi.',
   'target',     '{"kind":"questions_answered","threshold":100}', 50, 2),
  ('marathon',       'Bền bỉ',           'Trả lời 500 câu hỏi.',
   'infinity',   '{"kind":"questions_answered","threshold":500}', 200, 3),
  ('reading_100',    'Cày Đọc hiểu',     'Hoàn thành 100 câu Đọc hiểu.',
   'book-open',  '{"kind":"questions_by_type","type_id":4,"threshold":100}', 80, 4),
  ('cloze_100',      'Chuyên gia Cloze', 'Hoàn thành 100 câu Hoàn thành đoạn văn.',
   'file-text',  '{"kind":"questions_by_type","type_id":3,"threshold":100}', 80, 5),
  ('streak_10',      '10 ngày liên tục', 'Luyện tập 10 ngày liên tiếp.',
   'flame',      '{"kind":"streak","threshold":10}', 100, 6),
  ('streak_30',      'Một tháng không nghỉ', 'Luyện tập 30 ngày liên tiếp.',
   'flame',      '{"kind":"streak","threshold":30}', 300, 7),
  ('score_9',        'Điểm 9 đầu tiên',  'Đạt từ 9,0 điểm trong một bài thi thử.',
   'trophy',     '{"kind":"exam_score","threshold":9}', 200, 8),
  ('score_10',       'Điểm tuyệt đối',   'Đạt 10,0 điểm trong một bài thi thử.',
   'crown',      '{"kind":"exam_score","threshold":10}', 500, 9),
  ('grammar_king',   'Vua Ngữ pháp',     'Đúng từ 95% trở lên ở danh mục Ngữ pháp (tối thiểu 20 câu).',
   'graduation-cap', '{"kind":"accuracy_by_type","type_id":5,"threshold":95}', 250, 10);
