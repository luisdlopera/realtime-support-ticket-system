import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PasswordHasherPort, TOKENS, TokenServicePort, UserRepositoryPort } from "../ports/ports";
import { UserRole } from "../../domain/entities/domain.types";

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(TOKENS.PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(input: { name: string; email: string; password: string; role?: UserRole }) {
    const existing = await this.userRepository.findByEmail(input.email.toLowerCase());
    if (existing) {
      throw new BadRequestException("Email already exists");
    }
    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role ?? "CUSTOMER",
    });
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(TOKENS.PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKENS.TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await this.hasher.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const accessToken = this.tokenService.sign({ sub: user.id, role: user.role, email: user.email });
    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
