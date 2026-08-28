-- ============================================================================
-- NGÂN HÀNG CÂU HỎI — CLOZE TEST & ĐỌC HIỂU
-- ============================================================================

-- ---------------------------------------------------------------------------
-- DẠNG 3: HOÀN THÀNH ĐOẠN VĂN (CLOZE TEST) — 2 bài × 5 câu
-- ---------------------------------------------------------------------------
insert into passages (id, kind, title, content, source) values
('a3000000-0000-4000-8000-000000000001', 'cloze', 'Reading habits among teenagers',
E'Read the following passage and choose the best option for each blank.\n\nReading for pleasure is often the first habit to disappear when teenagers get busy. Yet research suggests that students who read regularly (1) ______ better vocabulary and stronger concentration than those who do not. The problem is rarely a lack of interest; it is a lack of time. Between homework, extra classes and social media, few teenagers have a quiet hour to spare.\n\nSome schools have responded (2) ______ setting aside fifteen minutes of silent reading at the start of each day. The idea is simple, but the results have been encouraging. Teachers report that students gradually begin to choose books (3) ______ their own, rather than waiting to be told what to read.\n\n(4) ______ , the habit does not form overnight. Experts advise starting with short, engaging texts and allowing students to abandon a book they dislike. A reader who finishes nothing but enjoys the process is (5) ______ likely to keep reading than one who is forced through a difficult classic.',
'Biên soạn nội bộ'),

('a3000000-0000-4000-8000-000000000002', 'cloze', 'Working from home',
E'Read the following passage and choose the best option for each blank.\n\nWhen offices closed in 2020, millions of employees suddenly found themselves working from their kitchen tables. What began as an emergency measure has now become a permanent (1) ______ for many companies.\n\nThe advantages are clear. Workers save the time they (2) ______ to spend commuting, and they can organise their day around their own energy levels. Employers, meanwhile, spend less on office space. A survey carried out last year found that nearly two thirds of staff would accept a lower salary (3) ______ they could keep working remotely at least part of the week.\n\nHowever, the arrangement is not without drawbacks. Younger employees, (4) ______ often learn by watching more experienced colleagues, may find it harder to develop. Isolation is another concern. The most successful companies are therefore those (5) ______ have found a balance, bringing teams together for a few days a month while leaving the rest of the schedule flexible.',
'Biên soạn nội bộ');

insert into questions (type_id, passage_id, position_in_passage, stem, options, correct_key, explanation, tip, difficulty, cefr_level, source) values
-- Cloze 1
(3, 'a3000000-0000-4000-8000-000000000001', 1, 'Chọn phương án đúng cho chỗ trống (1).',
 '[{"key":"A","text":"develop"},{"key":"B","text":"develops"},{"key":"C","text":"developing"},{"key":"D","text":"to develop"}]',
 'A',
 'Chủ ngữ là "students who read regularly" — danh từ số nhiều, nên động từ chính chia số nhiều: "develop". Mệnh đề quan hệ "who read regularly" chỉ bổ nghĩa cho students chứ không phải chủ ngữ chính, đây là bẫy quen thuộc khiến nhiều bạn chọn "develops".',
 'Khi chủ ngữ bị chen bởi mệnh đề quan hệ, hãy che mệnh đề đó đi để nhìn rõ chủ ngữ thật.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(3, 'a3000000-0000-4000-8000-000000000001', 2, 'Chọn phương án đúng cho chỗ trống (2).',
 '[{"key":"A","text":"by"},{"key":"B","text":"for"},{"key":"C","text":"with"},{"key":"D","text":"in"}]',
 'A',
 '"Respond by + V-ing" = phản ứng lại bằng cách làm gì. Ở đây các trường phản ứng bằng cách dành ra 15 phút đọc sách. "Respond to" mới là đáp lại ai/cái gì, còn for/with/in đều không đi với respond theo nghĩa này.',
 'Ghi nhớ cấu trúc "by + V-ing" luôn diễn tả PHƯƠNG THỨC làm việc gì đó.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(3, 'a3000000-0000-4000-8000-000000000001', 3, 'Chọn phương án đúng cho chỗ trống (3).',
 '[{"key":"A","text":"on"},{"key":"B","text":"by"},{"key":"C","text":"in"},{"key":"D","text":"at"}]',
 'A',
 '"On one''s own" = tự mình, không cần ai bảo. Câu đối lập trực tiếp với "rather than waiting to be told what to read" nên nghĩa "tự chọn sách" là hợp lý. "By oneself" cũng có nghĩa tương tự nhưng phải là "by themselves", không phải "by their own".',
 'Phân biệt: on their own = by themselves. Không có "by their own".',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

(3, 'a3000000-0000-4000-8000-000000000001', 4, 'Chọn phương án đúng cho chỗ trống (4).',
 '[{"key":"A","text":"Nevertheless"},{"key":"B","text":"Therefore"},{"key":"C","text":"Moreover"},{"key":"D","text":"For example"}]',
 'A',
 'Đoạn trước nói kết quả rất khả quan, câu sau lại nói thói quen không hình thành sau một đêm — quan hệ tương phản, cần từ nối nhượng bộ "Nevertheless". "Therefore" chỉ kết quả, "Moreover" chỉ bổ sung cùng chiều, "For example" chỉ ví dụ — đều sai hướng logic.',
 'Xác định quan hệ giữa hai ý (cùng chiều hay ngược chiều) TRƯỚC khi nhìn các phương án.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(3, 'a3000000-0000-4000-8000-000000000001', 5, 'Chọn phương án đúng cho chỗ trống (5).',
 '[{"key":"A","text":"more"},{"key":"B","text":"most"},{"key":"C","text":"as"},{"key":"D","text":"the most"}]',
 'A',
 'Cuối câu có "than one who is forced..." — dấu hiệu chắc chắn của so sánh hơn. Tính từ "likely" hai âm tiết nên dùng "more likely ... than". Các phương án so sánh nhất (most / the most) không đi với "than".',
 'Thấy "than" ở cuối câu là biết ngay phải dùng so sánh hơn, không cần đọc lại cả đoạn.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

-- Cloze 2
(3, 'a3000000-0000-4000-8000-000000000002', 1, 'Chọn phương án đúng cho chỗ trống (1).',
 '[{"key":"A","text":"arrangement"},{"key":"B","text":"arrange"},{"key":"C","text":"arranged"},{"key":"D","text":"arranging"}]',
 'A',
 'Sau "a permanent" (mạo từ + tính từ) bắt buộc phải là danh từ, nên chọn "arrangement" = sự sắp xếp, cách bố trí. Các phương án còn lại là động từ hoặc phân từ.',
 'Công thức nhận diện nhanh: a/an/the + tính từ + ____ thì chỗ trống chắc chắn là DANH TỪ.',
 'nhan_biet', 'B1', 'Biên soạn nội bộ'),

(3, 'a3000000-0000-4000-8000-000000000002', 2, 'Chọn phương án đúng cho chỗ trống (2).',
 '[{"key":"A","text":"used"},{"key":"B","text":"use"},{"key":"C","text":"are used"},{"key":"D","text":"were used"}]',
 'A',
 '"Used to + V" diễn tả thói quen trong quá khứ nay không còn: trước đây họ từng mất thời gian đi lại, giờ thì không. "Be used to + V-ing" lại mang nghĩa "quen với việc gì" — khác hẳn, và ở đây theo sau là "to spend" nên không dùng được.',
 'Phân biệt: used to + V nguyên mẫu (thói quen xưa) ≠ be/get used to + V-ing (đã quen).',
 'van_dung', 'B1', 'Biên soạn nội bộ'),

(3, 'a3000000-0000-4000-8000-000000000002', 3, 'Chọn phương án đúng cho chỗ trống (3).',
 '[{"key":"A","text":"if"},{"key":"B","text":"unless"},{"key":"C","text":"although"},{"key":"D","text":"despite"}]',
 'A',
 'Nhân viên chấp nhận lương thấp hơn VỚI ĐIỀU KIỆN được làm từ xa — đây là mệnh đề điều kiện nên dùng "if". "Unless" = nếu không, làm câu sai nghĩa hoàn toàn; "although" chỉ nhượng bộ; "despite" là giới từ, phải đi với danh từ chứ không đi với mệnh đề.',
 '"Despite / In spite of" + danh từ. "Although / Though" + mệnh đề. Nhầm chỗ này là mất điểm oan.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(3, 'a3000000-0000-4000-8000-000000000002', 4, 'Chọn phương án đúng cho chỗ trống (4).',
 '[{"key":"A","text":"who"},{"key":"B","text":"which"},{"key":"C","text":"whom"},{"key":"D","text":"whose"}]',
 'A',
 'Chỗ trống thay thế cho "Younger employees" (chỉ người) và làm CHỦ NGỮ của động từ "learn", nên dùng "who". "Whom" chỉ dùng khi làm tân ngữ, "which" dùng cho vật, "whose" chỉ sở hữu.',
 'Sau đại từ quan hệ mà có ngay ĐỘNG TỪ thì nó đang làm chủ ngữ → dùng who/which, không dùng whom.',
 'thong_hieu', 'B1', 'Biên soạn nội bộ'),

(3, 'a3000000-0000-4000-8000-000000000002', 5, 'Chọn phương án đúng cho chỗ trống (5).',
 '[{"key":"A","text":"that"},{"key":"B","text":"what"},{"key":"C","text":"whose"},{"key":"D","text":"where"}]',
 'A',
 'Mệnh đề quan hệ bổ nghĩa cho "those" (= those companies) và làm chủ ngữ cho "have found", nên dùng "that" hoặc "which". "What" không bao giờ làm đại từ quan hệ sau danh từ; "where" chỉ nơi chốn; "whose" chỉ sở hữu.',
 '"What" KHÔNG phải đại từ quan hệ — gặp danh từ đứng trước thì loại ngay phương án này.',
 'van_dung', 'B2', 'Biên soạn nội bộ');

-- ---------------------------------------------------------------------------
-- DẠNG 4: ĐỌC HIỂU — 3 bài × 7 câu
-- ---------------------------------------------------------------------------
insert into passages (id, kind, title, content, source) values
('a4000000-0000-4000-8000-000000000001', 'reading', 'The return of the night train',
E'For decades, the night train seemed to belong to the past. Cheap flights made it faster and often cheaper to fly between European cities, and one sleeper service after another was quietly withdrawn. By 2015, travelling from Paris to Vienna by train overnight was no longer possible.\n\nThen something shifted. Growing awareness of aviation''s carbon footprint, combined with a wave of interest in slower forms of travel, persuaded several rail operators to reconsider. Austria''s national railway was among the first to act, buying up carriages that other companies were preparing to scrap. Its network of sleeper routes now reaches more than a dozen countries.\n\nThe appeal is not purely environmental. A night train replaces both a hotel room and a day of travelling, and passengers arrive in the centre of a city rather than at an airport on its outskirts. For journeys of between six and twelve hours, the sleeper is often the most sensible option once check-in queues and transfers are taken into account.\n\nStill, the economics remain difficult. Sleeper carriages carry far fewer passengers than seated ones, and they are expensive to maintain. Several operators have concluded that the service only works with government support. Critics argue that such subsidies are hard to justify; supporters reply that aviation has enjoyed favourable tax treatment for years, and that the comparison is therefore not a fair one.\n\nWhat is clear is that demand exists. New routes launched in recent years have frequently sold out months in advance, and bookings from younger travellers, in particular, have risen sharply.',
'Biên soạn nội bộ'),

('a4000000-0000-4000-8000-000000000002', 'reading', 'Why cities are planting more trees',
E'Walk through almost any large city on a summer afternoon and you will notice something odd: the temperature changes from street to street. A road lined with mature trees can be several degrees cooler than an identical road without them. This difference, known to researchers as the urban heat island effect, is becoming a serious public health issue as summers grow hotter.\n\nTrees cool cities in two ways. Their canopies block sunlight before it reaches pavements and walls, and the water they release through their leaves absorbs heat from the surrounding air. A single mature tree can have roughly the cooling effect of several household air conditioners, without consuming any electricity.\n\nMany city governments have responded with ambitious planting targets. Yet planting is the easy part. Young trees in cities face compacted soil, limited water and frequent damage, and a significant proportion die within their first five years. Experts increasingly argue that maintaining existing mature trees delivers far better value than planting new ones, because the cooling benefit of a tree rises steeply with its size.\n\nThere is also a question of fairness. Studies in several countries have found that wealthier neighbourhoods tend to have noticeably more tree cover than poorer ones, meaning the residents least able to afford air conditioning are often those most exposed to extreme heat. Some cities have begun directing their planting budgets specifically towards the districts with the least existing shade.\n\nNone of this makes trees a complete solution. But among the available responses to urban heat, they are unusual in being relatively cheap, popular with residents, and beneficial in several ways at once.',
'Biên soạn nội bộ'),

('a4000000-0000-4000-8000-000000000003', 'reading', 'The trouble with measuring student progress',
E'Every school system needs some way of knowing whether its students are learning. The obvious method is to test them, and standardised tests have the attraction of producing numbers that can be compared across schools and across years. Governments find such numbers useful; so do parents choosing where to send their children.\n\nThe difficulty is that a test measures only what it is designed to measure. A reading test tells you how well a student answered particular questions about particular passages on a particular morning. It does not tell you whether that student enjoys reading, or will still be reading in ten years'' time. When test scores become the main measure of a school''s success, teachers face a strong incentive to concentrate on the tested material and neglect everything else — a pattern researchers call "teaching to the test".\n\nSome countries have tried to reduce this pressure by testing samples of students rather than every child, which still produces reliable national figures while removing the incentive for individual schools to distort their teaching. Others have added measures that are harder to game, such as tracking what students go on to do after leaving school.\n\nNeither approach is perfect. Sampling makes it impossible to identify a particular struggling school, and long-term tracking produces results too late to help the students concerned. Perhaps the most honest conclusion is that no single number can capture what a good education does, and that a system relying on one is likely to get the education it measures rather than the one it wants.',
'Biên soạn nội bộ');

insert into questions (type_id, passage_id, position_in_passage, stem, options, correct_key, explanation, tip, difficulty, cefr_level, source) values
-- Reading 1: night train
(4, 'a4000000-0000-4000-8000-000000000001', 1, 'What is the main idea of the passage?',
 '[{"key":"A","text":"Night trains are returning after years of decline, though their finances remain uncertain."},{"key":"B","text":"Air travel between European cities has become more expensive than rail travel."},{"key":"C","text":"Austria has built the largest railway network in Europe."},{"key":"D","text":"Governments should stop subsidising all forms of public transport."}]',
 'A',
 'Bài đi theo mạch: tàu đêm từng suy tàn → quay trở lại nhờ ý thức môi trường → có nhiều ưu điểm → nhưng bài toán kinh tế còn khó → nhu cầu vẫn tăng. Phương án A bao trọn cả hai vế "trở lại" và "kinh tế bấp bênh". B sai vì bài không nói vé máy bay đắt hơn tàu; C chỉ là chi tiết phụ; D là quan điểm của phe chỉ trích chứ không phải kết luận của bài.',
 'Ý chính phải bao được CẢ BÀI. Phương án nào chỉ đúng với một đoạn thì đó là bẫy chi tiết.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000001', 2, 'The word "withdrawn" in paragraph 1 is closest in meaning to ______.',
 '[{"key":"A","text":"cancelled"},{"key":"B","text":"extended"},{"key":"C","text":"repaired"},{"key":"D","text":"advertised"}]',
 'A',
 '"Withdrawn" ở đây nghĩa là bị rút khỏi hoạt động, tức bị huỷ bỏ — đồng nghĩa "cancelled". Ngữ cảnh xác nhận: câu sau nói tới 2015 thì tuyến Paris–Vienna "no longer possible". "Extended" (kéo dài) và "advertised" (quảng cáo) đều ngược hướng.',
 'Với câu hỏi từ đồng nghĩa, luôn đọc câu LIỀN SAU — nó thường xác nhận nghĩa bạn đoán.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000001', 3, 'According to paragraph 2, what did Austria''s national railway do?',
 '[{"key":"A","text":"It acquired carriages that other operators intended to destroy."},{"key":"B","text":"It designed an entirely new type of sleeper carriage."},{"key":"C","text":"It persuaded airlines to reduce their number of flights."},{"key":"D","text":"It withdrew from routes outside Austria."}]',
 'A',
 'Đoạn 2 nói rõ: "buying up carriages that other companies were preparing to scrap" — mua lại toa mà công ty khác định phá bỏ. "Scrap" = phá bỏ, nên A diễn đạt lại chính xác. D mâu thuẫn với câu ngay sau (mạng lưới nay tới hơn chục nước).',
 'Câu hỏi có "According to paragraph X" thì đáp án nằm gọn trong đoạn đó — đừng tìm chỗ khác.',
 'nhan_biet', 'B1', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000001', 4, 'The word "its" in paragraph 3 refers to ______.',
 '[{"key":"A","text":"a city"},{"key":"B","text":"a night train"},{"key":"C","text":"an airport"},{"key":"D","text":"a hotel room"}]',
 'A',
 'Cụm gốc là "in the centre of a city rather than at an airport on its outskirts" — "outskirts" (vùng ven) là vùng ven CỦA THÀNH PHỐ, đối lập với "centre of a city". Sân bay nằm ở vùng ven của thành phố, chứ sân bay không có "vùng ven" của riêng nó.',
 'Với câu hỏi tham chiếu, thay thử từng phương án vào chỗ đại từ rồi đọc lại — phương án nào nghe vô lý thì loại.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000001', 5, 'According to paragraph 3, when is a sleeper train most sensible?',
 '[{"key":"A","text":"On journeys lasting roughly six to twelve hours."},{"key":"B","text":"On journeys shorter than three hours."},{"key":"C","text":"Only when flights have been cancelled."},{"key":"D","text":"Whenever the destination has no airport."}]',
 'A',
 'Câu cuối đoạn 3 nêu chính xác: "For journeys of between six and twelve hours, the sleeper is often the most sensible option". Các phương án còn lại không có căn cứ trong bài.',
 'Các con số trong bài đọc hầu như luôn được hỏi — gạch chân chúng ngay khi đọc lần đầu.',
 'nhan_biet', 'B1', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000001', 6, 'What can be inferred about the supporters of subsidies?',
 '[{"key":"A","text":"They believe aviation already receives a form of financial advantage."},{"key":"B","text":"They think night trains should be free for all passengers."},{"key":"C","text":"They want all short-haul flights to be banned immediately."},{"key":"D","text":"They consider sleeper carriages cheap to maintain."}]',
 'A',
 'Phe ủng hộ lập luận rằng "aviation has enjoyed favourable tax treatment for years" — tức ngành hàng không vốn đã được ưu đãi thuế, nên so sánh là không công bằng. Suy ra họ cho rằng hàng không đã nhận một dạng ưu đãi tài chính. D mâu thuẫn trực tiếp với bài (toa nằm đắt đỏ để bảo trì).',
 'Câu hỏi suy luận (infer) không hỏi điều bài viết thẳng ra, nhưng đáp án vẫn phải CÓ CĂN CỨ trong bài — không được suy diễn xa.',
 'van_dung_cao', 'C1', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000001', 7, 'What does the last paragraph suggest about demand for night trains?',
 '[{"key":"A","text":"It is strong, especially among younger travellers."},{"key":"B","text":"It has fallen steadily since the new routes opened."},{"key":"C","text":"It comes almost entirely from business travellers."},{"key":"D","text":"It is limited to a small number of luxury routes."}]',
 'A',
 'Đoạn cuối nói các tuyến mới "frequently sold out months in advance" và lượng đặt chỗ từ khách trẻ "risen sharply" — cả hai đều cho thấy nhu cầu mạnh, đặc biệt ở nhóm trẻ. B ngược hẳn với "sold out"; C và D không có trong bài.',
 'Đoạn cuối bài đọc thường chứa kết luận hoặc xu hướng — hay được hỏi ở câu cuối.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

-- Reading 2: urban trees
(4, 'a4000000-0000-4000-8000-000000000002', 1, 'What is the passage mainly about?',
 '[{"key":"A","text":"The role of trees in cooling cities and the challenges of using them well."},{"key":"B","text":"How to plant a tree correctly in an urban environment."},{"key":"C","text":"Why air conditioning should be banned in large cities."},{"key":"D","text":"The history of public parks in European capitals."}]',
 'A',
 'Bài trình bày cơ chế làm mát của cây, các mục tiêu trồng cây, khó khăn khi cây non chết sớm, và vấn đề công bằng giữa các khu dân cư — tất cả xoay quanh vai trò của cây trong việc hạ nhiệt đô thị và những khó khăn đi kèm. B quá hẹp, C và D không được nhắc tới.',
 'Ý chính thường được gói trong câu đầu và câu cuối bài — đọc kỹ hai chỗ này trước.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000002', 2, 'According to paragraph 2, how do trees cool their surroundings?',
 '[{"key":"A","text":"By blocking sunlight and by releasing water through their leaves."},{"key":"B","text":"By absorbing carbon dioxide from vehicle exhaust."},{"key":"C","text":"By reducing the amount of electricity that buildings use."},{"key":"D","text":"By changing the direction of the wind between buildings."}]',
 'A',
 'Đoạn 2 nêu đúng hai cơ chế: tán cây chặn ánh nắng trước khi chạm vỉa hè và tường, và nước cây thoát qua lá hấp thụ nhiệt từ không khí. Phương án C nhắc tới điện nhưng bài chỉ nói cây làm mát mà KHÔNG tốn điện — không phải cơ chế làm mát.',
 'Cẩn thận với phương án dùng lại đúng từ trong bài nhưng gán sai vai trò — đây là bẫy phổ biến nhất.',
 'nhan_biet', 'B1', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000002', 3, 'The word "compacted" in paragraph 3 is closest in meaning to ______.',
 '[{"key":"A","text":"pressed tightly together"},{"key":"B","text":"rich in nutrients"},{"key":"C","text":"recently watered"},{"key":"D","text":"artificially coloured"}]',
 'A',
 '"Compacted soil" là đất bị nén chặt, khiến rễ khó phát triển — đây được liệt kê cùng "limited water" và "frequent damage" như những khó khăn của cây non. Vì là khó khăn nên loại ngay B và C (đều là điều kiện tốt).',
 'Nếu từ nằm trong một danh sách, các từ còn lại trong danh sách sẽ cho biết sắc thái tốt hay xấu.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000002', 4, 'Why do experts argue for maintaining existing mature trees?',
 '[{"key":"A","text":"Because a tree''s cooling benefit increases sharply as it grows larger."},{"key":"B","text":"Because mature trees require no water at all."},{"key":"C","text":"Because planting new trees is illegal in most cities."},{"key":"D","text":"Because young trees make streets look untidy."}]',
 'A',
 'Bài giải thích rõ lý do: "the cooling benefit of a tree rises steeply with its size" — lợi ích làm mát tăng mạnh theo kích thước, nên giữ cây lớn sẵn có đáng giá hơn trồng cây mới. B, C, D đều không có căn cứ.',
 'Câu hỏi "Why...?" thường có đáp án nằm ngay sau từ "because" trong bài.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000002', 5, 'What problem of fairness does paragraph 4 describe?',
 '[{"key":"A","text":"Poorer areas tend to have less tree cover yet greater exposure to heat."},{"key":"B","text":"Wealthier residents are charged more for planting permits."},{"key":"C","text":"Only city employees are allowed to plant trees."},{"key":"D","text":"Tree planting budgets are shared equally between all districts."}]',
 'A',
 'Đoạn 4 nói khu giàu có nhiều cây hơn khu nghèo, nghĩa là những người ít đủ khả năng lắp điều hoà nhất lại chịu nắng nóng nhiều nhất. Phương án D ngược với câu cuối đoạn (một số thành phố đang dồn ngân sách cho khu ít bóng mát, tức KHÔNG chia đều).',
 'Đọc kỹ từ "least/most" — chúng thường là mấu chốt của câu hỏi về sự bất bình đẳng.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000002', 6, 'What is the author''s attitude towards trees as a response to urban heat?',
 '[{"key":"A","text":"Positive but realistic about their limits."},{"key":"B","text":"Completely opposed to further planting."},{"key":"C","text":"Convinced that trees alone can solve the problem."},{"key":"D","text":"Indifferent to the outcome of planting programmes."}]',
 'A',
 'Câu cuối bài thể hiện rõ thái độ: "None of this makes trees a complete solution. But... they are unusual in being relatively cheap, popular... and beneficial in several ways at once." Vừa thừa nhận hạn chế, vừa đánh giá cao — tức tích cực nhưng thực tế. C mâu thuẫn với vế đầu, B mâu thuẫn với vế sau.',
 'Câu hỏi về thái độ tác giả: tìm câu có cấu trúc nhượng bộ "Không phải... nhưng mà..." ở cuối bài.',
 'van_dung_cao', 'C1', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000002', 7, 'Which of the following is NOT mentioned as a difficulty facing young city trees?',
 '[{"key":"A","text":"Attacks by insects imported from other countries"},{"key":"B","text":"Soil that is pressed too tightly"},{"key":"C","text":"An insufficient supply of water"},{"key":"D","text":"Being damaged frequently"}]',
 'A',
 'Đoạn 3 liệt kê ba khó khăn: đất bị nén (B), thiếu nước (C), và bị hư hại thường xuyên (D). Côn trùng ngoại lai hoàn toàn không được nhắc tới, nên A là đáp án.',
 'Với câu hỏi NOT/EXCEPT, hãy tick từng phương án tìm thấy trong bài — phương án còn lại chính là đáp án.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

-- Reading 3: measuring student progress
(4, 'a4000000-0000-4000-8000-000000000003', 1, 'What is the main purpose of the passage?',
 '[{"key":"A","text":"To examine the limitations of using tests to measure education."},{"key":"B","text":"To explain how to prepare students for standardised tests."},{"key":"C","text":"To argue that schools should abolish all forms of assessment."},{"key":"D","text":"To compare education systems in different continents."}]',
 'A',
 'Bài mở đầu bằng nhu cầu đo lường, sau đó dành phần lớn để chỉ ra hạn chế của bài kiểm tra chuẩn hoá và các cách khắc phục chưa hoàn hảo, kết bằng nhận định không con số nào đo trọn được giáo dục tốt. Đó là phân tích hạn chế, chứ không phải kêu gọi bỏ hẳn kiểm tra (C quá mạnh).',
 'Cẩn thận với phương án chứa từ tuyệt đối (all, never, abolish) — chúng thường mạnh hơn ý bài viết.',
 'van_dung', 'C1', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000003', 2, 'The phrase "teaching to the test" refers to the practice of ______.',
 '[{"key":"A","text":"focusing lessons on tested content while neglecting other learning"},{"key":"B","text":"allowing students to choose which subjects they are examined in"},{"key":"C","text":"testing teachers as well as students"},{"key":"D","text":"holding examinations more frequently than before"}]',
 'A',
 'Ngay trước cụm này, bài mô tả: giáo viên chịu áp lực "concentrate on the tested material and neglect everything else" — tập trung vào phần được kiểm tra và bỏ qua phần còn lại. Đó chính là định nghĩa của cụm.',
 'Khi bài đặt một cụm trong ngoặc kép, định nghĩa của nó gần như luôn nằm ở mệnh đề ngay trước.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000003', 3, 'According to paragraph 3, what is one advantage of testing only a sample of students?',
 '[{"key":"A","text":"It removes the pressure on individual schools to distort their teaching."},{"key":"B","text":"It produces results much more quickly than full testing."},{"key":"C","text":"It allows every struggling school to be identified."},{"key":"D","text":"It eliminates the need for national statistics."}]',
 'A',
 'Đoạn 3 nêu: lấy mẫu "still produces reliable national figures while removing the incentive for individual schools to distort their teaching". C thì ngược lại — đoạn 4 nói rõ lấy mẫu khiến KHÔNG thể xác định trường yếu cụ thể.',
 'Nếu hai phương án trái ngược nhau, một trong hai thường là đáp án — hãy kiểm tra kỹ cả hai trong bài.',
 'van_dung', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000003', 4, 'The word "game" in paragraph 3 is closest in meaning to ______.',
 '[{"key":"A","text":"manipulate"},{"key":"B","text":"celebrate"},{"key":"C","text":"postpone"},{"key":"D","text":"simplify"}]',
 'A',
 '"Harder to game" nghĩa là khó lách, khó thao túng để có kết quả đẹp — "game" ở đây là động từ mang nghĩa lợi dụng kẽ hở. Ngữ cảnh xác nhận: đây là biện pháp nhằm khắc phục việc các trường bóp méo cách dạy.',
 'Nhiều từ quen thuộc mang nghĩa hoàn toàn khác khi làm động từ (game, table, floor) — luôn xét theo ngữ cảnh.',
 'van_dung_cao', 'C1', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000003', 5, 'What drawback of long-term tracking does the passage mention?',
 '[{"key":"A","text":"Its results appear too late to benefit the students being measured."},{"key":"B","text":"It is far more expensive than standardised testing."},{"key":"C","text":"It cannot produce reliable national figures."},{"key":"D","text":"It requires students to sit additional examinations."}]',
 'A',
 'Đoạn 4 nêu: "long-term tracking produces results too late to help the students concerned". Các nhược điểm về chi phí hay thi thêm không được bài nhắc tới.',
 'Đừng chọn phương án chỉ vì nghe hợp lý ngoài đời — nó phải được VIẾT RA trong bài.',
 'thong_hieu', 'B2', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000003', 6, 'What does the author suggest in the final sentence?',
 '[{"key":"A","text":"A system judged by one measure will tend to produce only what that measure captures."},{"key":"B","text":"Education systems should be judged purely by examination results."},{"key":"C","text":"Teachers are mainly responsible for falling standards."},{"key":"D","text":"Parents should not be given information about schools."}]',
 'A',
 'Câu cuối: hệ thống dựa vào một con số duy nhất "is likely to get the education it measures rather than the one it wants" — tức sẽ chỉ tạo ra đúng thứ mà nó đo, không phải thứ nó mong muốn. Phương án A diễn đạt lại chính xác ý này.',
 'Câu cuối bài nghị luận thường là thông điệp cốt lõi — đọc chậm và diễn đạt lại bằng lời của mình trước khi nhìn phương án.',
 'van_dung_cao', 'C1', 'Biên soạn nội bộ'),

(4, 'a4000000-0000-4000-8000-000000000003', 7, 'Which statement would the author most likely agree with?',
 '[{"key":"A","text":"Tests are useful but should not be the only measure of a school."},{"key":"B","text":"Comparing schools by test scores is always misleading."},{"key":"C","text":"Governments should stop collecting educational data."},{"key":"D","text":"Reading tests accurately predict lifelong reading habits."}]',
 'A',
 'Tác giả thừa nhận hệ thống nào cũng cần cách đo lường và các con số có ích cho chính phủ lẫn phụ huynh, nhưng cảnh báo về việc chỉ dựa vào một thước đo. Vậy A là quan điểm cân bằng khớp nhất. D bị bác trực tiếp ở đoạn 2, B và C đều quá tuyệt đối.',
 'Với câu hỏi "tác giả sẽ đồng ý với điều gì", đáp án thường là phương án ÔN HOÀ nhất trong bốn phương án.',
 'van_dung_cao', 'C1', 'Biên soạn nội bộ');
