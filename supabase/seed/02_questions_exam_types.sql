-- ============================================================================
-- NGÂN HÀNG CÂU HỎI — 4 DẠNG BÀI CÓ TRONG ĐỀ THI THẬT
-- Bộ mẫu để chạy thử toàn bộ luồng và làm khuôn cho giáo viên soạn tiếp.
-- ⚠️ Đây KHÔNG phải đề thi chính thức (spec mục 7): cần giáo viên chuyên môn
--    thẩm định trước khi dùng cho học sinh thật.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- DẠNG 1: ĐIỀN TỪ/CÂU VÀO THÔNG BÁO, QUẢNG CÁO, BIỂN HIỆU
-- ---------------------------------------------------------------------------
insert into passages (id, kind, title, content, source) values
('a1000000-0000-4000-8000-000000000001', 'notice', 'Library notice',
E'CENTRAL CITY LIBRARY\n\nFrom 1 June, the Reading Room will close at 6 p.m. instead of 9 p.m.\nBooks may still be returned at any time using the drop box by the main gate.\nWe ______ for any inconvenience this may cause.', 'Biên soạn nội bộ'),

('a1000000-0000-4000-8000-000000000002', 'notice', 'Swimming pool sign',
E'RIVERSIDE SWIMMING POOL\n\nChildren under 12 ______ be accompanied by an adult at all times.\nNo diving in the shallow end.\nLockers are free of charge.', 'Biên soạn nội bộ'),

('a1000000-0000-4000-8000-000000000003', 'notice', 'Café advertisement',
E'THE GREEN BEAN CAFÉ\n\nBring your own cup and get 20% ______ every hot drink.\nOpen daily 7 a.m. – 10 p.m.\nFree Wi-Fi for all customers.', 'Biên soạn nội bộ'),

('a1000000-0000-4000-8000-000000000004', 'notice', 'School club leaflet',
E'ENGLISH SPEAKING CLUB — NEW MEMBERS WELCOME\n\nMeetings: every Friday, 4 p.m., Room B203.\n______\nNo registration fee. Just come and join us!', 'Biên soạn nội bộ'),

('a1000000-0000-4000-8000-000000000005', 'notice', 'Museum entrance sign',
E'NATIONAL HISTORY MUSEUM\n\nPhotography is permitted, but please ______ your flash.\nBags larger than 30cm must be left at the cloakroom.\nLast admission: 4.30 p.m.', 'Biên soạn nội bộ'),

('a1000000-0000-4000-8000-000000000006', 'notice', 'Train station announcement',
E'PLATFORM 4 — IMPORTANT\n\nThe 07:45 service to Da Nang has been delayed ______ approximately 25 minutes.\nPassengers holding advance tickets may travel on the 08:20 service instead.\nWe apologise for the delay.', 'Biên soạn nội bộ'),

('a1000000-0000-4000-8000-000000000007', 'notice', 'Supermarket promotion',
E'FRESH MART — WEEKEND DEAL\n\nBuy two packs of fresh fruit and get the third one ______.\nOffer valid Saturday and Sunday only, while stocks last.\nMembership card required.', 'Biên soạn nội bộ'),

('a1000000-0000-4000-8000-000000000008', 'notice', 'Volunteer recruitment poster',
E'BEACH CLEAN-UP DAY — 15 JULY\n\nWe need 50 volunteers to help keep our coastline clean.\nGloves and bags will be provided.\n______', 'Biên soạn nội bộ');

insert into questions (type_id, passage_id, stem, options, correct_key, explanation, tip, difficulty, cefr_level, source) values
(1, 'a1000000-0000-4000-8000-000000000001',
 'Chọn phương án đúng để điền vào chỗ trống.',
 '[{"key":"A","text":"apologise"},{"key":"B","text":"apologising"},{"key":"C","text":"apologised"},{"key":"D","text":"to apologise"}]',
 'A',
 'Chủ ngữ là "We", câu ở thì hiện tại đơn diễn tả lời xin lỗi tại thời điểm nói, nên động từ giữ nguyên dạng: "We apologise for...". Đây là cách nói cố định rất hay gặp trong thông báo. Các phương án B, C, D đều sai vì câu đã có chủ ngữ nhưng thiếu động từ chia thì.',
 'Trong thông báo, cụm "We apologise for any inconvenience" gần như là công thức — học thuộc cả cụm sẽ nhanh hơn phân tích.',
 'nhan_biet', 'A2', 'Biên soạn nội bộ'),

(1, 'a1000000-0000-4000-8000-000000000002',
 'Chọn phương án đúng để điền vào chỗ trống.',
 '[{"key":"A","text":"should"},{"key":"B","text":"must"},{"key":"C","text":"might"},{"key":"D","text":"could"}]',
 'B',
 'Đây là quy định bắt buộc ở bể bơi, kèm cụm "at all times" (mọi lúc) nên phải dùng "must" chỉ nghĩa vụ bắt buộc. "Should" chỉ là lời khuyên, "might/could" chỉ khả năng — đều quá nhẹ so với một quy định an toàn.',
 'Gặp biển hiệu quy định an toàn, nghĩ ngay tới must / must not, ít khi là should.',
 'thong_hieu', 'A2', 'Biên soạn nội bộ'),

(1, 'a1000000-0000-4000-8000-000000000003',
 'Chọn phương án đúng để điền vào chỗ trống.',
 '[{"key":"A","text":"off"},{"key":"B","text":"out"},{"key":"C","text":"down"},{"key":"D","text":"away"}]',
 'A',
 '"20% off + danh từ" là cách diễn đạt chuẩn để nói giảm giá 20% cho mặt hàng nào đó. "20% out/down/away" đều không tồn tại trong tiếng Anh thương mại.',
 'Giảm giá luôn đi với "off": 50% off, $5 off.',
 'nhan_biet', 'A2', 'Biên soạn nội bộ'),

(1, 'a1000000-0000-4000-8000-000000000004',
 'Chọn câu phù hợp nhất để điền vào chỗ trống.',
 '[{"key":"A","text":"All levels are welcome, from beginner to advanced."},{"key":"B","text":"The library will be closed for repairs."},{"key":"C","text":"Please submit your assignment before Monday."},{"key":"D","text":"Tickets cost 200,000 VND per person."}]',
 'A',
 'Tờ rơi đang mời thành viên mới và kết bằng "No registration fee. Just come and join us!" — giọng điệu khuyến khích, không rào cản. Câu A tiếp tục mạch đó (mọi trình độ đều tham gia được). Câu D mâu thuẫn trực tiếp vì đã nói không mất phí; B và C lạc chủ đề hoàn toàn.',
 'Với dạng điền cả câu, hãy đọc câu ĐỨNG SAU chỗ trống trước — nó thường quyết định câu nào hợp mạch.',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

(1, 'a1000000-0000-4000-8000-000000000005',
 'Chọn phương án đúng để điền vào chỗ trống.',
 '[{"key":"A","text":"turn off"},{"key":"B","text":"turn on"},{"key":"C","text":"turn up"},{"key":"D","text":"turn into"}]',
 'A',
 'Bảo tàng cho phép chụp ảnh "nhưng" (but) yêu cầu tắt đèn flash để bảo vệ hiện vật. "Turn off" = tắt. "Turn on" = bật (ngược nghĩa), "turn up" = tăng âm lượng / xuất hiện, "turn into" = biến thành.',
 'Từ nối "but" báo hiệu vế sau đối lập với vế trước — cho phép chụp NHƯNG cấm một thứ gì đó.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(1, 'a1000000-0000-4000-8000-000000000006',
 'Chọn phương án đúng để điền vào chỗ trống.',
 '[{"key":"A","text":"by"},{"key":"B","text":"in"},{"key":"C","text":"for"},{"key":"D","text":"at"}]',
 'A',
 '"Delayed by + khoảng thời gian" = bị hoãn thêm bao lâu. Ở đây tàu bị hoãn thêm khoảng 25 phút. "Delayed for" nghe được trong khẩu ngữ nhưng "by" mới là chuẩn khi nói về mức độ chênh lệch.',
 'Giới từ "by" luôn đi với mức độ thay đổi: increased by 5%, delayed by 25 minutes.',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

(1, 'a1000000-0000-4000-8000-000000000007',
 'Chọn phương án đúng để điền vào chỗ trống.',
 '[{"key":"A","text":"free"},{"key":"B","text":"freely"},{"key":"C","text":"freedom"},{"key":"D","text":"freeing"}]',
 'A',
 'Sau "get + tân ngữ" cần một tính từ bổ nghĩa: "get the third one free" = được tặng gói thứ ba miễn phí. "Freely" là trạng từ (một cách tự do), "freedom" là danh từ, "freeing" là phân từ — đều không hợp.',
 'Dạng câu hỏi word form: xác định vị trí trống cần loại từ nào (danh/động/tính/trạng) trước khi nhìn nghĩa.',
 'thong_hieu', 'A2', 'Biên soạn nội bộ'),

(1, 'a1000000-0000-4000-8000-000000000008',
 'Chọn câu phù hợp nhất để điền vào chỗ trống.',
 '[{"key":"A","text":"Sign up at the school office before 10 July."},{"key":"B","text":"The beach will be closed to the public all summer."},{"key":"C","text":"Only professional cleaners may take part."},{"key":"D","text":"Volunteers must bring their own gloves and bags."}]',
 'A',
 'Áp phích đang tuyển tình nguyện viên nên câu cuối cần là lời kêu gọi hành động cụ thể — đăng ký ở đâu, hạn nào. Câu D mâu thuẫn với dòng ngay trên ("Gloves and bags will be provided"), câu C mâu thuẫn với việc kêu gọi 50 tình nguyện viên, câu B phủ định luôn mục đích của sự kiện.',
 'Loại nhanh các phương án MÂU THUẪN với thông tin đã có trong tờ rơi — thường có tới 2 phương án loại được kiểu này.',
 'van_dung', 'B1', 'Biên soạn nội bộ');

-- ---------------------------------------------------------------------------
-- DẠNG 2: SẮP XẾP CÂU / ĐOẠN HỘI THOẠI
-- meta.sentences giữ các câu đã đánh nhãn a-d để giao diện hiển thị riêng.
-- ---------------------------------------------------------------------------
insert into passages (id, kind, title, content, meta, source) values
('a2000000-0000-4000-8000-000000000001', 'ordering', 'Hội thoại: hỏi đường',
 'Sắp xếp các câu sau thành một đoạn hội thoại hoàn chỉnh.',
 '{"sentences":[
   {"label":"a","text":"Go straight for about 200 metres, then turn left at the traffic lights."},
   {"label":"b","text":"Excuse me, could you tell me how to get to the post office?"},
   {"label":"c","text":"Thank you so much for your help!"},
   {"label":"d","text":"Sure. It''s not far from here at all."}
 ]}', 'Biên soạn nội bộ'),

('a2000000-0000-4000-8000-000000000002', 'ordering', 'Hội thoại: đặt bàn nhà hàng',
 'Sắp xếp các câu sau thành một đoạn hội thoại hoàn chỉnh.',
 '{"sentences":[
   {"label":"a","text":"For four people, at seven in the evening, please."},
   {"label":"b","text":"Good evening. I''d like to book a table for this Saturday."},
   {"label":"c","text":"That''s all arranged. See you on Saturday, Mr Nam."},
   {"label":"d","text":"Certainly. For how many people and what time?"}
 ]}', 'Biên soạn nội bộ'),

('a2000000-0000-4000-8000-000000000003', 'ordering', 'Đoạn văn: lợi ích của việc đi xe đạp',
 'Sắp xếp các câu sau thành một đoạn văn mạch lạc.',
 '{"sentences":[
   {"label":"a","text":"More and more city dwellers are choosing bicycles for their daily commute."},
   {"label":"b","text":"As a result, several cities have started building protected bicycle lanes."},
   {"label":"c","text":"This shift is driven by rising fuel prices and growing concern about air quality."},
   {"label":"d","text":"However, many riders still say that safety on busy roads remains their biggest worry."}
 ]}', 'Biên soạn nội bộ'),

('a2000000-0000-4000-8000-000000000004', 'ordering', 'Hội thoại: mượn sách thư viện',
 'Sắp xếp các câu sau thành một đoạn hội thoại hoàn chỉnh.',
 '{"sentences":[
   {"label":"a","text":"You can keep it for two weeks, and you may renew it once online."},
   {"label":"b","text":"Hi, I''d like to borrow this book. How long can I keep it?"},
   {"label":"c","text":"Great, that''s exactly what I needed. Thanks!"},
   {"label":"d","text":"Just remember there''s a small fine for late returns."}
 ]}', 'Biên soạn nội bộ'),

('a2000000-0000-4000-8000-000000000005', 'ordering', 'Đoạn văn: học trực tuyến',
 'Sắp xếp các câu sau thành một đoạn văn mạch lạc.',
 '{"sentences":[
   {"label":"a","text":"Online learning became widespread during the pandemic."},
   {"label":"b","text":"Students could study from home without travelling to school."},
   {"label":"c","text":"Nevertheless, most teachers agree that it cannot fully replace face-to-face teaching."},
   {"label":"d","text":"This flexibility saved them a great deal of time and money."}
 ]}', 'Biên soạn nội bộ'),

('a2000000-0000-4000-8000-000000000006', 'ordering', 'Hội thoại: hẹn gặp bạn',
 'Sắp xếp các câu sau thành một đoạn hội thoại hoàn chỉnh.',
 '{"sentences":[
   {"label":"a","text":"How about Sunday morning instead?"},
   {"label":"b","text":"Are you free on Saturday afternoon?"},
   {"label":"c","text":"Sunday works perfectly. Let''s meet at nine."},
   {"label":"d","text":"I''m afraid not — I have a part-time job then."}
 ]}', 'Biên soạn nội bộ'),

('a2000000-0000-4000-8000-000000000007', 'ordering', 'Đoạn văn: rác thải nhựa',
 'Sắp xếp các câu sau thành một đoạn văn mạch lạc.',
 '{"sentences":[
   {"label":"a","text":"Plastic waste has become one of the most visible environmental problems of our time."},
   {"label":"b","text":"Millions of tonnes of it end up in the ocean every year."},
   {"label":"c","text":"Some countries have therefore banned single-use plastic bags altogether."},
   {"label":"d","text":"Once there, it breaks down into tiny particles that enter the food chain."}
 ]}', 'Biên soạn nội bộ'),

('a2000000-0000-4000-8000-000000000008', 'ordering', 'Hội thoại: phỏng vấn xin việc làm thêm',
 'Sắp xếp các câu sau thành một đoạn hội thoại hoàn chỉnh.',
 '{"sentences":[
   {"label":"a","text":"I''m available on weekday evenings and all day at weekends."},
   {"label":"b","text":"Thanks for coming in. Could you tell me when you can work?"},
   {"label":"c","text":"That fits our schedule well. We''ll contact you by Friday."},
   {"label":"d","text":"I look forward to hearing from you."}
 ]}', 'Biên soạn nội bộ');

insert into questions (type_id, passage_id, stem, options, correct_key, explanation, tip, difficulty, cefr_level, source) values
(2, 'a2000000-0000-4000-8000-000000000001',
 'Sắp xếp các câu trên theo đúng trật tự.',
 '[{"key":"A","text":"b – d – a – c"},{"key":"B","text":"b – a – d – c"},{"key":"C","text":"d – b – a – c"},{"key":"D","text":"b – d – c – a"}]',
 'A',
 'Hội thoại hỏi đường luôn bắt đầu bằng lời hỏi (b). Người kia nhận lời và trấn an "It''s not far" (d), rồi mới chỉ đường cụ thể (a). Cuối cùng là lời cảm ơn (c). Phương án D sai vì cảm ơn trước khi được chỉ đường.',
 'Câu mở đầu gần như luôn là câu có "Excuse me" hoặc lời chào; câu kết thường là lời cảm ơn.',
 'nhan_biet', 'A2', 'Biên soạn nội bộ'),

(2, 'a2000000-0000-4000-8000-000000000002',
 'Sắp xếp các câu trên theo đúng trật tự.',
 '[{"key":"A","text":"b – d – a – c"},{"key":"B","text":"b – a – d – c"},{"key":"C","text":"d – a – b – c"},{"key":"D","text":"b – d – c – a"}]',
 'A',
 'Khách mở lời đặt bàn (b) → nhân viên hỏi lại số người và giờ (d) → khách trả lời "For four people, at seven" (a) → nhân viên xác nhận đã xong (c). Cặp hỏi–đáp d–a phải đi liền nhau vì (a) là câu trả lời trực tiếp cho câu hỏi trong (d).',
 'Tìm cặp hỏi–đáp trước: một câu hỏi và câu trả lời khớp nội dung luôn đứng cạnh nhau.',
 'thong_hieu', 'A2', 'Biên soạn nội bộ'),

(2, 'a2000000-0000-4000-8000-000000000003',
 'Sắp xếp các câu trên theo đúng trật tự.',
 '[{"key":"A","text":"a – c – b – d"},{"key":"B","text":"a – b – c – d"},{"key":"C","text":"c – a – d – b"},{"key":"D","text":"a – d – c – b"}]',
 'A',
 'Câu (a) nêu hiện tượng chung → (c) giải thích nguyên nhân ("This shift" nhắc lại hiện tượng ở a) → (b) nêu hệ quả ("As a result") → (d) nêu mặt hạn chế ("However"). Chuỗi từ nối This shift → As a result → However chính là bộ khung của đoạn.',
 'Bám vào từ nối và đại từ thay thế: "This/These + danh từ" luôn trỏ ngược về câu ngay trước nó.',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

(2, 'a2000000-0000-4000-8000-000000000004',
 'Sắp xếp các câu trên theo đúng trật tự.',
 '[{"key":"A","text":"b – a – d – c"},{"key":"B","text":"b – d – a – c"},{"key":"C","text":"a – b – d – c"},{"key":"D","text":"b – a – c – d"}]',
 'A',
 'Học sinh hỏi mượn sách và hỏi thời hạn (b) → thủ thư trả lời thời hạn hai tuần (a) → nhắc thêm về phí trả muộn (d) → học sinh cảm ơn (c). Phương án D đặt lời cảm ơn trước lời nhắc, khiến câu (d) bị lơ lửng không ai đáp.',
 'Lời cảm ơn/kết thúc gần như luôn nằm ở vị trí cuối cùng.',
 'thong_hieu', 'A2', 'Biên soạn nội bộ'),

(2, 'a2000000-0000-4000-8000-000000000005',
 'Sắp xếp các câu trên theo đúng trật tự.',
 '[{"key":"A","text":"a – b – d – c"},{"key":"B","text":"a – d – b – c"},{"key":"C","text":"b – a – d – c"},{"key":"D","text":"a – b – c – d"}]',
 'A',
 '(a) nêu bối cảnh → (b) nêu lợi ích cụ thể (học ở nhà) → (d) khái quát lợi ích đó bằng "This flexibility" (trỏ về b) → (c) nêu ý phản biện bằng "Nevertheless". Phương án D sai vì đặt câu phản biện vào giữa, cắt đứt mạch lợi ích.',
 'Câu chứa "Nevertheless / However / On the other hand" hiếm khi đứng đầu đoạn — nó cần một ý trước để phản biện lại.',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

(2, 'a2000000-0000-4000-8000-000000000006',
 'Sắp xếp các câu trên theo đúng trật tự.',
 '[{"key":"A","text":"b – d – a – c"},{"key":"B","text":"b – a – d – c"},{"key":"C","text":"a – b – d – c"},{"key":"D","text":"b – d – c – a"}]',
 'A',
 'Rủ đi chơi thứ Bảy (b) → từ chối vì bận làm thêm (d) → đề xuất đổi sang Chủ nhật (a) → chốt lịch (c). Cụm "instead" trong (a) chỉ có nghĩa khi đứng sau lời từ chối (d).',
 'Từ "instead" báo hiệu câu này thay thế cho một phương án vừa bị loại ở câu trước.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(2, 'a2000000-0000-4000-8000-000000000007',
 'Sắp xếp các câu trên theo đúng trật tự.',
 '[{"key":"A","text":"a – b – d – c"},{"key":"B","text":"a – d – b – c"},{"key":"C","text":"b – a – d – c"},{"key":"D","text":"a – b – c – d"}]',
 'A',
 '(a) nêu vấn đề → (b) đưa số liệu về lượng nhựa ra đại dương → (d) mô tả điều xảy ra tiếp theo, mở đầu bằng "Once there" trỏ về "the ocean" ở (b) → (c) nêu phản ứng chính sách bằng "therefore". Cụm "Once there" bắt buộc phải đứng ngay sau câu có nhắc tới nơi chốn.',
 'Trạng từ chỉ nơi chốn dạng "there / here" luôn trỏ về địa điểm vừa nhắc ở câu liền trước.',
 'van_dung_cao', 'B2', 'Biên soạn nội bộ'),

(2, 'a2000000-0000-4000-8000-000000000008',
 'Sắp xếp các câu trên theo đúng trật tự.',
 '[{"key":"A","text":"b – a – c – d"},{"key":"B","text":"b – c – a – d"},{"key":"C","text":"a – b – c – d"},{"key":"D","text":"b – a – d – c"}]',
 'A',
 'Nhà tuyển dụng mở lời và hỏi lịch rảnh (b) → ứng viên trả lời (a) → nhà tuyển dụng nhận xét phù hợp và hẹn liên hệ (c) → ứng viên đáp lễ "I look forward to hearing from you" (d). Câu (d) là câu đáp lại lời hẹn liên hệ ở (c) nên buộc phải đứng sau.',
 '"I look forward to hearing from you" là câu kết chuẩn mực trong hội thoại phỏng vấn.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ');
