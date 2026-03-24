import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PasswordHasherPort, TokenServicePort } from "../../application/ports/ports";

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  hash(plainText: string) {
    return bcrypt.hash(plainText, 10);
  }

  compare(plainText: string, hash: string) {
    return bcrypt.compare(plainText, hash);
  }
}

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: { sub: string; role: string; email: string }) {
    return this.jwtService.sign(payload);
  }

  verify(token: string) {
    return this.jwtService.verify(token);
  }
}
