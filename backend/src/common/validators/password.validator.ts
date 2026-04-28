import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isStrongPassword",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (typeof value !== "string") return false;

          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-\[\]\\\/]/.test(value);
          const minLength = value.length >= 8;

          return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && minLength;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must have at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character`;
        },
      },
    });
  };
}
