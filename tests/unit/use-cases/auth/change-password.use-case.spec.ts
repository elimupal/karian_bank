import { ChangePasswordUseCase } from '@/application/use-cases/auth/change-password.use-case';
import { ChangePasswordDto } from '@/application/dtos/auth/change-password.dto';
import { BadRequestError, NotFoundError } from '@/utils/errors';

// Mocks for interfaces
class MockUser {
  public password: string;
  public changePassword = jest.fn();
  constructor(password: string) {
    this.password = password;
  }
}

describe('ChangePasswordUseCase', () => {
  const userId = 'user-123';
  const oldPassword = 'OldPass123!';
  const newPassword = 'NewPass123!';

  let userRepository: any;
  let passwordService: any;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    passwordService = {
      compare: jest.fn(),
      validateStrength: jest.fn(),
      hash: jest.fn(),
    };
  });

  it('changes password successfully', async () => {
    const user = new MockUser('hashed-old');

    userRepository.findById.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(true);
    passwordService.validateStrength.mockReturnValue({ isValid: true, errors: [] });
    passwordService.hash.mockResolvedValue('hashed-new');

    const useCase = new ChangePasswordUseCase(userRepository, passwordService);
    const dto = new ChangePasswordDto(userId, oldPassword, newPassword);

    await expect(useCase.execute(dto)).resolves.toBeUndefined();

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(passwordService.compare).toHaveBeenCalledWith(oldPassword, user.password);
    expect(passwordService.validateStrength).toHaveBeenCalledWith(newPassword);
    expect(passwordService.hash).toHaveBeenCalledWith(newPassword);
    expect(user.changePassword).toHaveBeenCalledWith('hashed-new');
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it('throws NotFoundError when user not found', async () => {
    userRepository.findById.mockResolvedValue(null);

    const useCase = new ChangePasswordUseCase(userRepository, passwordService);
    const dto = new ChangePasswordDto(userId, oldPassword, newPassword);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(NotFoundError);
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
  });

  it('throws BadRequestError when old password is incorrect', async () => {
    const user = new MockUser('hashed-old');
    userRepository.findById.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(false);

    const useCase = new ChangePasswordUseCase(userRepository, passwordService);
    const dto = new ChangePasswordDto(userId, oldPassword, newPassword);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(BadRequestError);
    expect(passwordService.compare).toHaveBeenCalledWith(oldPassword, user.password);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when new password is weak', async () => {
    const user = new MockUser('hashed-old');
    userRepository.findById.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(true);
    passwordService.validateStrength.mockReturnValue({ isValid: false, errors: ['too short'] });

    const useCase = new ChangePasswordUseCase(userRepository, passwordService);
    const dto = new ChangePasswordDto(userId, oldPassword, 'weak');

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(BadRequestError);
    expect(passwordService.validateStrength).toHaveBeenCalledWith('weak');
    expect(userRepository.save).not.toHaveBeenCalled();
  });
});