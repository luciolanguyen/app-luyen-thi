-- ============================================================================
-- NGÂN HÀNG CÂU HỎI — NGỮ PHÁP TRỌNG TÂM & TỪ VỰNG THEO CHỦ ĐỀ
-- Bám các chuyên đề spec liệt kê ở mục 0: câu điều kiện loại 1, so sánh kép,
-- bị động nguyên nhân, mệnh đề quan hệ, câu tường thuật, liên từ, cụm động từ.
-- ============================================================================

insert into questions (type_id, topic_id, stem, options, correct_key, explanation, tip, difficulty, cefr_level, source) values

-- ---------------------------------------------------------------------------
-- CÂU ĐIỀU KIỆN LOẠI 1
-- ---------------------------------------------------------------------------
(5, (select id from topics where code = 'conditional_1'),
 'If the weather ______ fine tomorrow, we will visit the botanical garden.',
 '[{"key":"A","text":"is"},{"key":"B","text":"will be"},{"key":"C","text":"were"},{"key":"D","text":"would be"}]',
 'A',
 'Câu điều kiện loại 1 có công thức: If + S + V(hiện tại đơn), S + will + V. Mệnh đề "if" KHÔNG dùng "will" dù nói về tương lai. "Were" và "would be" thuộc câu điều kiện loại 2 (giả định trái thực tế).',
 'Nhớ nguyên tắc vàng: không bao giờ có "will" ngay sau "if" trong câu điều kiện loại 1.',
 'nhan_biet', 'A2', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'conditional_1'),
 'Unless you ______ your application before Friday, you will miss the deadline.',
 '[{"key":"A","text":"submit"},{"key":"B","text":"don''t submit"},{"key":"C","text":"will submit"},{"key":"D","text":"submitted"}]',
 'A',
 '"Unless" đã mang sẵn nghĩa phủ định (= if not), nên mệnh đề sau nó phải ở dạng KHẲNG ĐỊNH. Câu này nghĩa là "Nếu bạn không nộp trước thứ Sáu, bạn sẽ lỡ hạn". Chọn B là phủ định hai lần, làm sai nghĩa hoàn toàn.',
 'Unless = If...not. Đã dùng unless thì tuyệt đối không thêm "not" nữa.',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

-- ---------------------------------------------------------------------------
-- SO SÁNH KÉP (DOUBLE COMPARISON)
-- ---------------------------------------------------------------------------
(5, (select id from topics where code = 'double_comparison'),
 'The more you practise speaking English, ______ you will become.',
 '[{"key":"A","text":"the more confident"},{"key":"B","text":"more confident"},{"key":"C","text":"the most confident"},{"key":"D","text":"as confident as"}]',
 'A',
 'Cấu trúc so sánh kép: The + so sánh hơn + S + V, the + so sánh hơn + S + V. Vế đầu đã có "The more you practise" nên vế sau bắt buộc có "the" đứng trước: "the more confident you will become". Thiếu "the" (phương án B) là lỗi rất hay gặp.',
 'So sánh kép luôn có ĐÚNG HAI chữ "the" — kiểm tra đủ hai chữ là gần như chắc đúng.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'double_comparison'),
 '______ we started, the sooner we would finish the project.',
 '[{"key":"A","text":"The earlier"},{"key":"B","text":"Earlier"},{"key":"C","text":"The early"},{"key":"D","text":"As early as"}]',
 'A',
 'Vế sau là "the sooner we would finish" nên vế đầu phải song song về cấu trúc: "The + so sánh hơn". Tính từ "early" thành so sánh hơn là "earlier" (đổi -y thành -ier), kèm "the" phía trước.',
 'Hai vế của so sánh kép phải ĐỐI XỨNG nhau về cấu trúc — nhìn vế đã cho để suy ra vế còn thiếu.',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

-- ---------------------------------------------------------------------------
-- BỊ ĐỘNG NGUYÊN NHÂN (CAUSATIVE PASSIVE)
-- ---------------------------------------------------------------------------
(5, (select id from topics where code = 'causative_passive'),
 'My parents are going to ______ our kitchen ______ next month.',
 '[{"key":"A","text":"have / redecorated"},{"key":"B","text":"have / redecorate"},{"key":"C","text":"make / redecorated"},{"key":"D","text":"get / redecorate"}]',
 'A',
 'Cấu trúc bị động nguyên nhân: have + tân ngữ (vật) + V3/V-ed, nghĩa là nhờ/thuê người khác làm gì đó. Bếp không tự trang trí được nên phải dùng phân từ quá khứ "redecorated". Với "get" thì cũng dùng V3: get it redecorated.',
 'Ghi nhớ: have/get + VẬT + V3 (nhờ người làm) ≠ have + NGƯỜI + V nguyên mẫu (sai khiến ai làm).',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'causative_passive'),
 'She had her passport ______ while she was travelling in Europe.',
 '[{"key":"A","text":"stolen"},{"key":"B","text":"steal"},{"key":"C","text":"stealing"},{"key":"D","text":"to steal"}]',
 'A',
 'Ngoài nghĩa "nhờ ai làm", cấu trúc have + tân ngữ + V3 còn diễn tả điều KHÔNG MONG MUỐN xảy đến với mình: "had her passport stolen" = bị mất trộm hộ chiếu. Hộ chiếu là vật bị đánh cắp nên dùng phân từ quá khứ "stolen".',
 'Cùng cấu trúc have + O + V3 nhưng có hai nghĩa: chủ động nhờ vả, hoặc bị động chịu đựng. Ngữ cảnh quyết định.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

-- ---------------------------------------------------------------------------
-- MỆNH ĐỀ QUAN HỆ
-- ---------------------------------------------------------------------------
(5, (select id from topics where code = 'relative_clause'),
 'The teacher ______ advice helped me most has just retired.',
 '[{"key":"A","text":"whose"},{"key":"B","text":"who"},{"key":"C","text":"whom"},{"key":"D","text":"which"}]',
 'A',
 'Sau chỗ trống là danh từ "advice" không có mạo từ — dấu hiệu của quan hệ sở hữu: lời khuyên CỦA thầy giáo. Vì vậy dùng "whose". Nếu dùng "who" thì phải có động từ ngay sau, không phải danh từ.',
 'Quy tắc nhanh: sau chỗ trống là DANH TỪ trần (không a/an/the) thì gần như chắc chắn là "whose".',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'relative_clause'),
 'Hue, ______ was once the imperial capital of Vietnam, attracts many tourists.',
 '[{"key":"A","text":"which"},{"key":"B","text":"that"},{"key":"C","text":"where"},{"key":"D","text":"who"}]',
 'A',
 'Đây là mệnh đề quan hệ không xác định (có dấu phẩy), bổ nghĩa cho tên riêng "Hue". Mệnh đề không xác định KHÔNG BAO GIỜ dùng "that", nên loại B. Chỗ trống làm chủ ngữ cho "was" nên dùng "which" (chỉ vật/nơi chốn), không dùng "where" vì "where" thay cho trạng ngữ nơi chốn chứ không làm chủ ngữ.',
 'Thấy dấu phẩy trước đại từ quan hệ là loại ngay "that" — đây là điểm ăn chắc.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

-- ---------------------------------------------------------------------------
-- CÂU TƯỜNG THUẬT
-- ---------------------------------------------------------------------------
(5, (select id from topics where code = 'reported_speech'),
 '"I will call you tomorrow," Lan said to Minh. → Lan told Minh that she ______ him the following day.',
 '[{"key":"A","text":"would call"},{"key":"B","text":"will call"},{"key":"C","text":"called"},{"key":"D","text":"had called"}]',
 'A',
 'Khi chuyển sang câu tường thuật với động từ tường thuật ở quá khứ ("told"), thì của câu gốc phải lùi một bậc: will → would. Trạng từ cũng đổi: tomorrow → the following day (đề bài đã đổi sẵn).',
 'Bảng lùi thì cần thuộc: will→would, can→could, hiện tại đơn→quá khứ đơn, quá khứ đơn→quá khứ hoàn thành.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'reported_speech'),
 '"Where did you buy this dictionary?" she asked me. → She asked me where ______ that dictionary.',
 '[{"key":"A","text":"I had bought"},{"key":"B","text":"did I buy"},{"key":"C","text":"I did buy"},{"key":"D","text":"had I bought"}]',
 'A',
 'Câu hỏi tường thuật phải chuyển về trật tự CÂU KỂ (chủ ngữ đứng trước động từ), bỏ trợ động từ "did". Thì quá khứ đơn lùi thành quá khứ hoàn thành: bought → had bought. Phương án B và D giữ trật tự câu hỏi nên sai.',
 'Lỗi phổ biến nhất ở dạng này là quên đảo lại trật tự — tường thuật câu hỏi thì KHÔNG còn đảo ngữ.',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'reported_speech'),
 '"Don''t forget to lock the door," my mother said. → My mother reminded me ______ the door.',
 '[{"key":"A","text":"to lock"},{"key":"B","text":"locking"},{"key":"C","text":"that lock"},{"key":"D","text":"lock"}]',
 'A',
 'Động từ "remind" đi với cấu trúc remind somebody TO DO something. Câu gốc là lời nhắc nhở nên chuyển thành "reminded me to lock the door". Lưu ý câu gốc phủ định ("Don''t forget") nhưng ý nghĩa lại là khẳng định (hãy nhớ khoá cửa) nên không dùng "not to lock".',
 'Cẩn thận với "Don''t forget to..." — nghĩa thật là "hãy nhớ", nên khi tường thuật KHÔNG thêm "not".',
 'van_dung_cao', 'B2', 'Biên soạn nội bộ'),

-- ---------------------------------------------------------------------------
-- LIÊN TỪ & TỪ NỐI
-- ---------------------------------------------------------------------------
(5, (select id from topics where code = 'conjunctions'),
 '______ the heavy rain, the outdoor concert went ahead as planned.',
 '[{"key":"A","text":"Despite"},{"key":"B","text":"Although"},{"key":"C","text":"Because of"},{"key":"D","text":"However"}]',
 'A',
 'Sau chỗ trống là cụm danh từ "the heavy rain" (không có động từ), nên phải dùng giới từ "Despite". "Although" là liên từ, cần cả mệnh đề có chủ ngữ và động từ. "Because of" đúng ngữ pháp nhưng sai nghĩa (mưa to không phải LÝ DO để buổi diễn vẫn diễn ra).',
 'Trước tiên xét NGỮ PHÁP (sau chỗ trống là danh từ hay mệnh đề?), sau đó mới xét nghĩa.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'conjunctions'),
 'The film was not only entertaining ______ genuinely informative.',
 '[{"key":"A","text":"but also"},{"key":"B","text":"and also"},{"key":"C","text":"as well"},{"key":"D","text":"or else"}]',
 'A',
 'Cặp liên từ tương liên cố định là "not only... but also...". Đã có "not only" ở vế đầu thì vế sau bắt buộc là "but also". Đây là cặp không thể thay thế bằng "and also".',
 'Học thuộc các cặp đi liền: not only...but also, either...or, neither...nor, both...and.',
 'nhan_biet', 'B1', 'Biên soạn nội bộ'),

-- ---------------------------------------------------------------------------
-- CỤM ĐỘNG TỪ
-- ---------------------------------------------------------------------------
(5, (select id from topics where code = 'phrasal_verbs'),
 'She decided to ______ smoking after her doctor warned her about the risks.',
 '[{"key":"A","text":"give up"},{"key":"B","text":"give in"},{"key":"C","text":"give away"},{"key":"D","text":"give out"}]',
 'A',
 '"Give up" = từ bỏ một thói quen. "Give in" = nhượng bộ, đầu hàng; "give away" = cho đi, tiết lộ; "give out" = phát ra, phân phát. Ngữ cảnh bác sĩ cảnh báo nguy cơ nên nghĩa "bỏ thuốc" là hợp lý.',
 'Cùng động từ "give" nhưng đổi giới từ là đổi hẳn nghĩa — nên học phrasal verb theo cả cụm, đừng học rời.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'phrasal_verbs'),
 'We had to ______ the picnic because of the storm warning.',
 '[{"key":"A","text":"call off"},{"key":"B","text":"call on"},{"key":"C","text":"call up"},{"key":"D","text":"call for"}]',
 'A',
 '"Call off" = huỷ bỏ (sự kiện đã lên kế hoạch). "Call on" = ghé thăm/kêu gọi ai đó, "call up" = gọi điện, "call for" = đòi hỏi, yêu cầu. Cảnh báo bão là lý do để huỷ chuyến dã ngoại.',
 '"Call off" đồng nghĩa với "cancel" — hai từ này thường thay thế nhau trong câu hỏi paraphrase.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

-- ---------------------------------------------------------------------------
-- BỊ ĐỘNG & CẤU TẠO TỪ
-- ---------------------------------------------------------------------------
(5, (select id from topics where code = 'passive_voice'),
 'The new library ______ by the end of this year.',
 '[{"key":"A","text":"will have been completed"},{"key":"B","text":"will have completed"},{"key":"C","text":"has been completed"},{"key":"D","text":"is completing"}]',
 'A',
 'Cụm "by the end of this year" chỉ mốc thời gian trong tương lai mà hành động sẽ hoàn tất trước đó → dùng tương lai hoàn thành. Thư viện là vật được xây nên phải ở dạng bị động: will have been + V3.',
 'Cụm "by + mốc thời gian tương lai" là dấu hiệu kinh điển của thì tương lai hoàn thành.',
 'van_dung_cao', 'B2', 'Biên soạn nội bộ'),

(5, (select id from topics where code = 'word_forms'),
 'The team''s ______ to finish the project on time impressed the whole company.',
 '[{"key":"A","text":"determination"},{"key":"B","text":"determined"},{"key":"C","text":"determine"},{"key":"D","text":"determinedly"}]',
 'A',
 'Sau sở hữu cách "The team''s" phải là một danh từ, và danh từ đó làm chủ ngữ cho động từ "impressed". "Determination" (sự quyết tâm) là danh từ duy nhất trong bốn phương án.',
 'Xác định chức năng ngữ pháp của chỗ trống trước: nó là chủ ngữ, tân ngữ, hay bổ ngữ? Từ đó suy ra loại từ.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

-- ---------------------------------------------------------------------------
-- TỪ VỰNG THEO CHỦ ĐỀ
-- ---------------------------------------------------------------------------
(6, (select id from topics where code = 'env'),
 'Many countries are investing in ______ energy sources such as wind and solar power.',
 '[{"key":"A","text":"renewable"},{"key":"B","text":"renewed"},{"key":"C","text":"renewing"},{"key":"D","text":"renewal"}]',
 'A',
 '"Renewable energy" = năng lượng tái tạo, là cụm cố định chỉ nguồn năng lượng không cạn kiệt như gió và mặt trời. "Renewed" = được làm mới lại, "renewal" là danh từ (sự gia hạn) — đều không đi với "energy sources" theo nghĩa này.',
 'Chủ đề môi trường có nhiều cụm cố định: renewable energy, carbon footprint, climate change, greenhouse gas.',
 'nhan_biet', 'B1', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'env'),
 'The factory was fined for ______ chemical waste into the river.',
 '[{"key":"A","text":"discharging"},{"key":"B","text":"discharge"},{"key":"C","text":"discharged"},{"key":"D","text":"to discharge"}]',
 'A',
 'Sau giới từ "for" bắt buộc dùng danh động từ V-ing. "Discharge" ở đây nghĩa là xả, thải ra — phù hợp với việc nhà máy bị phạt vì xả chất thải hoá học ra sông.',
 'Sau MỌI giới từ (for, by, in, of, without...) đều dùng V-ing, không dùng động từ nguyên mẫu.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'tech'),
 'Smartphones have completely ______ the way we communicate with each other.',
 '[{"key":"A","text":"transformed"},{"key":"B","text":"transferred"},{"key":"C","text":"transported"},{"key":"D","text":"translated"}]',
 'A',
 '"Transform" = biến đổi hoàn toàn, thay đổi về bản chất — hợp với ý điện thoại thông minh làm thay đổi cách giao tiếp. "Transfer" = chuyển giao, "transport" = vận chuyển, "translate" = dịch thuật.',
 'Bốn từ này có cùng tiền tố "trans-" (xuyên qua) nhưng khác hẳn nghĩa — dạng bẫy rất hay gặp.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'tech'),
 'Before posting personal information online, you should consider the ______ carefully.',
 '[{"key":"A","text":"consequences"},{"key":"B","text":"conveniences"},{"key":"C","text":"conferences"},{"key":"D","text":"confidences"}]',
 'A',
 '"Consequences" = hậu quả, kết quả kéo theo — hợp với lời khuyên cân nhắc trước khi đăng thông tin cá nhân. "Conveniences" = tiện nghi, "conferences" = hội nghị, "confidences" = sự tin tưởng/bí mật.',
 'Các từ gần giống nhau về hình thức (consequence/convenience/conference) là bẫy quen thuộc — đọc kỹ từng chữ cái.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'education'),
 'She was awarded a full ______ to study medicine at a top university.',
 '[{"key":"A","text":"scholarship"},{"key":"B","text":"membership"},{"key":"C","text":"partnership"},{"key":"D","text":"leadership"}]',
 'A',
 '"Scholarship" = học bổng, khoản tài trợ cho việc học. Ba phương án còn lại đều có hậu tố "-ship" nhưng chỉ tư cách thành viên, quan hệ đối tác và khả năng lãnh đạo — không liên quan tới việc tài trợ học tập.',
 'Đừng chọn chỉ vì đúng hậu tố — phải khớp cả gốc từ.',
 'nhan_biet', 'B1', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'education'),
 'The lecturer spoke so quickly that most students found it hard to ______ the main points.',
 '[{"key":"A","text":"grasp"},{"key":"B","text":"grab"},{"key":"C","text":"grip"},{"key":"D","text":"gather"}]',
 'A',
 '"Grasp" ngoài nghĩa nắm chặt còn mang nghĩa nắm bắt, hiểu được một ý tưởng — đây là nghĩa dùng trong ngữ cảnh học thuật. "Grab" và "grip" chỉ hành động nắm bằng tay vật lý; "gather" là tập hợp lại.',
 '"Grasp / comprehend / take in" đều có nghĩa hiểu — hay xuất hiện ở câu hỏi từ đồng nghĩa.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'health'),
 'Regular exercise can significantly ______ the risk of heart disease.',
 '[{"key":"A","text":"reduce"},{"key":"B","text":"decline"},{"key":"C","text":"shorten"},{"key":"D","text":"lessen"}]',
 'A',
 '"Reduce the risk" là cụm kết hợp cố định (collocation) chuẩn trong tiếng Anh y khoa. "Decline" thường là nội động từ (tự giảm xuống, không có tân ngữ trực tiếp kiểu này), "shorten" dùng cho độ dài, "lessen" tuy gần nghĩa nhưng không kết hợp tự nhiên với "risk".',
 'Học từ vựng theo CỤM KẾT HỢP: reduce the risk, meet a deadline, make a decision — sẽ ăn điểm dạng này.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'health'),
 'After the accident, it took him several months to make a full ______.',
 '[{"key":"A","text":"recovery"},{"key":"B","text":"repair"},{"key":"C","text":"return"},{"key":"D","text":"relief"}]',
 'A',
 '"Make a full recovery" = hồi phục hoàn toàn, là cụm cố định khi nói về sức khoẻ sau tai nạn hoặc bệnh tật. "Repair" dùng cho đồ vật, "return" là sự trở lại, "relief" là sự nhẹ nhõm/cứu trợ.',
 'Cụm "make a full recovery" xuất hiện rất nhiều trong bài đọc về sức khoẻ — nên thuộc nguyên cụm.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'culture'),
 'Tet is deeply ______ in Vietnamese culture and family tradition.',
 '[{"key":"A","text":"rooted"},{"key":"B","text":"planted"},{"key":"C","text":"grown"},{"key":"D","text":"seeded"}]',
 'A',
 '"Be deeply rooted in" = bắt rễ sâu, ăn sâu vào — cụm ẩn dụ chuẩn để nói một tập tục gắn chặt với văn hoá. Các từ còn lại tuy cùng trường nghĩa cây cối nhưng không tạo thành cụm cố định này.',
 'Nhiều cụm về văn hoá dùng ẩn dụ cây cối: deeply rooted, branch out, bear fruit.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(6, (select id from topics where code = 'career'),
 'Employers increasingly value candidates who can work ______ in a team.',
 '[{"key":"A","text":"collaboratively"},{"key":"B","text":"collaborative"},{"key":"C","text":"collaboration"},{"key":"D","text":"collaborate"}]',
 'A',
 'Chỗ trống bổ nghĩa cho động từ "work" nên cần một trạng từ: "collaboratively" (một cách hợp tác). "Collaborative" là tính từ, "collaboration" là danh từ, "collaborate" là động từ.',
 'Trạng từ bổ nghĩa cho ĐỘNG TỪ, tính từ bổ nghĩa cho DANH TỪ — xác định từ bị bổ nghĩa là ra đáp án.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ');
