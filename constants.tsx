
import { Difficulty, Question, QuestionType, Account, UserRole } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin123',
    role: UserRole.TEACHER,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  // --- TOÁN (Math) ---
  { id: 'math-e1-1', subject: 'Toán', type: QuestionType.FILL_IN_BLANK, difficulty: Difficulty.EASY, level: 1, text: '1 + 1 = ?', answer: '2' },
  { id: 'math-e1-2', subject: 'Toán', type: QuestionType.MULTIPLE_CHOICE, difficulty: Difficulty.EASY, level: 1, text: 'Số nào sau đây là số chẵn?', options: ['1', '3', '4', '7'], answer: '4' },
  { id: 'math-e1-3', subject: 'Toán', type: QuestionType.TRUE_FALSE, difficulty: Difficulty.EASY, level: 1, text: 'Hình vuông có 4 cạnh bằng nhau.', answer: 'True' },
  { id: 'math-e1-4', subject: 'Toán', type: QuestionType.MULTIPLE_CHOICE, difficulty: Difficulty.EASY, level: 1, text: 'Ký hiệu của số Pi là gì?', options: ['π', 'Σ', 'Δ', 'Ω'], answer: 'π' },
  { id: 'math-e1-5', subject: 'Toán', type: QuestionType.FILL_IN_BLANK, difficulty: Difficulty.EASY, level: 1, text: '5 x 5 = ?', answer: '25' },

  // --- NGỮ VĂN (Literature) ---
  { id: 'lit-e1-1', subject: 'Ngữ Văn', type: QuestionType.MULTIPLE_CHOICE, difficulty: Difficulty.EASY, level: 1, text: 'Ai là tác giả của Truyện Kiều?', options: ['Nguyễn Du', 'Nguyễn Trãi', 'Hồ Xuân Hương', 'Đoàn Thị Điểm'], answer: 'Nguyễn Du' },
  { id: 'lit-e1-2', subject: 'Ngữ Văn', type: QuestionType.TRUE_FALSE, difficulty: Difficulty.EASY, level: 1, text: '"Lão Hạc" là tác phẩm của Nam Cao.', answer: 'True' },

  // --- TIẾNG ANH (English) ---
  { id: 'eng-e1-1', subject: 'Tiếng Anh', type: QuestionType.MULTIPLE_CHOICE, difficulty: Difficulty.EASY, level: 1, text: 'Từ nào sau đây là màu sắc?', options: ['Blue', 'Run', 'Apple', 'Fast'], answer: 'Blue' },
  { id: 'eng-e1-2', subject: 'Tiếng Anh', type: QuestionType.FILL_IN_BLANK, difficulty: Difficulty.EASY, level: 1, text: 'Hello nghĩa là gì?', answer: 'Xin chào' },

  // --- LỊCH SỬ (History) ---
  { id: 'his-e1-1', subject: 'Sử', type: QuestionType.MULTIPLE_CHOICE, difficulty: Difficulty.EASY, level: 1, text: 'Năm nào Việt Nam giành độc lập?', options: ['1945', '1954', '1975', '1930'], answer: '1945' },
  { id: 'his-e1-2', subject: 'Sử', type: QuestionType.TRUE_FALSE, difficulty: Difficulty.EASY, level: 1, text: 'Chiến thắng Điện Biên Phủ diễn ra năm 1954.', answer: 'True' },

  // --- ĐỊA LÝ (Geography) ---
  { id: 'geo-e1-1', subject: 'Địa', type: QuestionType.MULTIPLE_CHOICE, difficulty: Difficulty.EASY, level: 1, text: 'Thủ đô của Việt Nam là gì?', options: ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Huế'], answer: 'Hà Nội' },
  { id: 'geo-e1-2', subject: 'Địa', type: QuestionType.TRUE_FALSE, difficulty: Difficulty.EASY, level: 1, text: 'Sông Mê Kông chảy qua Việt Nam.', answer: 'True' }
];

export const getRandomAvatar = (seed: string) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`;
export const XP_PER_LEVEL = 1000;
export const MAX_SUB_LEVELS = 10;
export const QUIZ_TIMER_SECONDS = 30;
export const BASE_POINTS = 10;
export const TIME_BONUS_MULTIPLIER = 0;
