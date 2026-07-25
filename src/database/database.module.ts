import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { ActivationToken } from '../auth/entities/activation-token.entity';
import { BlacklistedToken } from '../auth/entities/blacklisted-token.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';

const ALL_ENTITIES = [
  Category,
  Product,
  Customer,
  Order,
  User,
  Role,
  Permission,
  ActivationToken,
  BlacklistedToken,
  PasswordResetToken,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('database.host'),
        port: configService.getOrThrow<number>('database.port'),
        username: configService.getOrThrow<string>('database.username'),
        password: configService.getOrThrow<string>('database.password'),
        database: configService.getOrThrow<string>('database.database'),
        /**
         * synchronize is always false. Schema changes are applied exclusively
         * through TypeORM migrations so that production deployments remain safe
         * and reproducible across all environments.
         */
        synchronize: false,
        logging: configService.get<boolean>('database.logging') ?? false,
        entities: ALL_ENTITIES,
        migrations: [__dirname + '/migrations/*.js'],
      }),
    }),
  ],
})
export class DatabaseModule {}
