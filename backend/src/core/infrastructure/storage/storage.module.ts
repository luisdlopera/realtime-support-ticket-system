import { Global, Module } from "@nestjs/common";
import { R2StorageService, R2_STORAGE_PROVIDER } from "./r2.service";

@Global()
@Module({
  providers: [R2StorageService, R2_STORAGE_PROVIDER],
  exports: [R2StorageService, R2_STORAGE_PROVIDER],
})
export class StorageModule {}
