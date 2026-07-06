import {
  validateProject,
  validateSkill,
  validateExperience,
  validateMessageReply,
  validateRegister,
  validateLogin,
} from '../validation';

describe('Validation Tests', () => {
  describe('validateProject', () => {
    it('should validate required fields', () => {
      const errors = validateProject({});
      expect(errors.title).toBeDefined();
    });

    it('should pass for a valid project', () => {
      const errors = validateProject({
        title: 'Mon Projet',
        description: 'Description',
        tags: 'React, Next.js',
      });
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should validate URL format', () => {
      const errors = validateProject({
        title: 'Mon Projet',
        liveUrl: 'invalid-url',
      });
      expect(errors.liveUrl).toBeDefined();
    });

    it('should accept valid URLs', () => {
      const errors = validateProject({
        title: 'Mon Projet',
        liveUrl: 'https://example.com',
        githubUrl: 'https://github.com',
      });
      expect(errors.liveUrl).toBeUndefined();
      expect(errors.githubUrl).toBeUndefined();
    });
  });

  describe('validateSkill', () => {
    it('should require name and category', () => {
      const errors = validateSkill({});
      expect(errors.name).toBeDefined();
      expect(errors.category).toBeDefined();
    });

    it('should validate level is between 0 and 100', () => {
      expect(validateSkill({ name: 'React', category: 'Frontend', level: -1 }).level).toBeDefined();
      expect(validateSkill({ name: 'React', category: 'Frontend', level: 101 }).level).toBeDefined();
      expect(validateSkill({ name: 'React', category: 'Frontend', level: 50 }).level).toBeUndefined();
    });

    it('should pass for a valid skill', () => {
      const errors = validateSkill({
        name: 'React',
        category: 'Frontend',
        level: 90,
      });
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('validateExperience', () => {
    it('should validate required fields', () => {
      const errors = validateExperience({});
      expect(errors.type).toBeDefined();
      expect(errors.title).toBeDefined();
      expect(errors.company).toBeDefined();
      expect(errors.startDate).toBeDefined();
    });

    it('should validate end date when not current', () => {
      const errors = validateExperience({
        type: 'work',
        title: 'Développeur',
        company: 'Test',
        startDate: '2022-01',
        current: false,
      });
      expect(errors.endDate).toBeDefined();
    });

    it('should validate dates are in order', () => {
      const errors = validateExperience({
        type: 'work',
        title: 'Développeur',
        company: 'Test',
        startDate: '2022-01',
        endDate: '2021-01',
        current: false,
      });
      expect(errors.endDate).toBeDefined();
    });

    it('should pass for valid experience', () => {
      const errors = validateExperience({
        type: 'work',
        title: 'Développeur',
        company: 'Test',
        startDate: '2022-01',
        endDate: '2023-01',
        current: false,
      });
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('validateMessageReply', () => {
    it('should require a non-empty message', () => {
      expect(validateMessageReply('').message).toBeDefined();
      expect(validateMessageReply('   ').message).toBeDefined();
    });

    it('should reject very short messages', () => {
      expect(validateMessageReply('a').message).toBeDefined();
    });

    it('should pass for valid message', () => {
      const errors = validateMessageReply('Merci pour votre message, je vais vous répondre rapidement !');
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('validateRegister', () => {
    it('should validate required fields', () => {
      const errors = validateRegister({});
      expect(errors.name).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    });

    it('should validate email format', () => {
      const errors = validateRegister({ name: 'Test', email: 'invalid', password: 'password' });
      expect(errors.email).toBeDefined();
    });

    it('should validate password length', () => {
      const errors = validateRegister({ name: 'Test', email: 'test@example.com', password: '12345' });
      expect(errors.password).toBeDefined();
    });

    it('should pass for valid data', () => {
      const errors = validateRegister({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('validateLogin', () => {
    it('should validate required fields', () => {
      const errors = validateLogin({});
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    });

    it('should validate email format', () => {
      const errors = validateLogin({ email: 'invalid', password: 'password' });
      expect(errors.email).toBeDefined();
    });

    it('should pass for valid data', () => {
      const errors = validateLogin({
        email: 'test@example.com',
        password: 'password',
      });
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});
