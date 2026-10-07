-- P1 schema-only baseline; contains no INSERT data.
-- Source file: yisu_hotel-2026-10-07_152046-dump.sql
-- Source SHA-256: 2bb52079f4addfe71cf1e8aac9e10da2f66f42847c2a78c4ca4392ee0f36db75
-- Extracted tables: 14
-- Review before importing; this file intentionally excludes GTID and session-global statements.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标题',
  `imageUrl` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片地址',
  `targetHotelId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '跳转酒店ID',
  `enabled` tinyint NOT NULL DEFAULT '1' COMMENT '是否启用',
  `startAt` datetime DEFAULT NULL COMMENT '开始时间',
  `endAt` datetime DEFAULT NULL COMMENT '结束时间',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序（数值越小越靠前）',
  PRIMARY KEY (`id`),
  KEY `IDX_84ec62425a41f67f7c5798bc74` (`targetHotelId`),
  KEY `IDX_57b1dc6ab4fe6cda5275c219c1` (`enabled`),
  KEY `IDX_9089509136fbba025a0ce42450` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `calendar_price`;
CREATE TABLE `calendar_price` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `roomTypeId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '日期（YYYY-MM-DD）',
  `price` decimal(10,2) NOT NULL COMMENT '价格（单位：元）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_4c56db496f8cbf63d0bb9a1b69` (`roomTypeId`,`date`),
  KEY `IDX_6918dce453b9ebb7feb07f504b` (`roomTypeId`),
  KEY `IDX_aa387b1836ee6bd5c08e5aa03e` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `calendar_stock`;
CREATE TABLE `calendar_stock` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `roomTypeId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '日期（YYYY-MM-DD）',
  `stock` int NOT NULL COMMENT '库存（>=0）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_88dfbec853dad6e3711afcc3e2` (`roomTypeId`,`date`),
  KEY `IDX_0e04543939742d7754cd30c7fd` (`roomTypeId`),
  KEY `IDX_834b2d4f16de5d9cf31b2d32e9` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `facilities`;
CREATE TABLE `facilities` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设施名称',
  `enabled` tinyint NOT NULL DEFAULT '1' COMMENT '是否启用',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `type` enum('TAG','FACILITY') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FACILITY' COMMENT '设施类型：TAG=标签类，FACILITY=设施类',
  `category` enum('BASIC','ROOM','DINING','ENTERTAINMENT','BUSINESS','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTHER' COMMENT '设施分类：用于前端分组展示',
  PRIMARY KEY (`id`),
  KEY `IDX_8f0d8306f4cacecf214682f425` (`type`),
  KEY `IDX_06bcfef94e04a223a5c4692193` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hotel_audit_records`;
CREATE TABLE `hotel_audit_records` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hotelId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '酒店ID',
  `action` enum('SUBMIT','APPROVE','REJECT','PUBLISH','OFFLINE','RESTORE','WITHDRAW','OFFLINE_REQUEST') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '动作类型',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '原因',
  `operatorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作人ID',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `IDX_25759cb97c5508f3fb2039bcdf` (`hotelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hotel_facilities`;
CREATE TABLE `hotel_facilities` (
  `hotelId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `facilityId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`hotelId`,`facilityId`),
  KEY `IDX_9c02c076c93425b2c73557675d` (`hotelId`),
  KEY `IDX_3cf78f1e3bc08b4d4baef19854` (`facilityId`),
  CONSTRAINT `FK_3cf78f1e3bc08b4d4baef19854d` FOREIGN KEY (`facilityId`) REFERENCES `facilities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_9c02c076c93425b2c73557675dd` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hotel_images`;
CREATE TABLE `hotel_images` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hotelId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属酒店ID',
  `url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片URL',
  `sortOrder` int NOT NULL DEFAULT '0' COMMENT '排序（越小越靠前）',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `IDX_2f4f6a21d05e1af3616a63310c` (`hotelId`),
  CONSTRAINT `FK_2f4f6a21d05e1af3616a63310cd` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hotel_poi`;
CREATE TABLE `hotel_poi` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hotelId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `poiId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8c1c6c17168eeb4cd91070b281` (`hotelId`,`poiId`),
  KEY `IDX_a9bdeac65bb1144f6f570f37e6` (`hotelId`),
  KEY `IDX_50adb9c9ed2bddebea82f1940f` (`poiId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hotel_tags`;
CREATE TABLE `hotel_tags` (
  `hotelId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`hotelId`,`tagId`),
  KEY `IDX_7a9876ba9effa98aeed29ce6af` (`hotelId`),
  KEY `IDX_b6e59a8852917b8636d21cbb88` (`tagId`),
  CONSTRAINT `FK_7a9876ba9effa98aeed29ce6af8` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_b6e59a8852917b8636d21cbb880` FOREIGN KEY (`tagId`) REFERENCES `facilities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hotels`;
CREATE TABLE `hotels` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nameZh` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '酒店名称（中文）',
  `nameEn` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '酒店名称（英文）',
  `hotelID` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '酒店业务ID',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '酒店地址（用于展示）',
  `latitude` double DEFAULT NULL COMMENT '纬度',
  `longitude` double DEFAULT NULL COMMENT '经度',
  `city` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属城市',
  `starLevel` int DEFAULT NULL COMMENT '酒店星级（0-10）',
  `miniPrice` decimal(10,2) DEFAULT '0.00' COMMENT '最低起价（自动由房型价格计算）',
  `favoriteCount` int DEFAULT '0' COMMENT '收藏数（展示用）',
  `openSince` date DEFAULT NULL COMMENT '开业时间',
  `nearby` json DEFAULT NULL COMMENT '附近信息',
  `discountInfo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '优惠/折扣描述',
  `rejectReason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '驳回原因',
  `merchantId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属商户ID',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `status` int NOT NULL DEFAULT '0' COMMENT '酒店状态',
  `score` decimal(3,2) DEFAULT '0.00' COMMENT '酒店评分（0-5分）',
  `hasEverPublished` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否曾发布过(0=未发布,1=已发布过)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_c8d6c2af0d0c53616e0aa0b205` (`hotelID`),
  KEY `IDX_e3e6627bf975abd616a7914adc` (`nameZh`),
  KEY `IDX_0e86e173223d49cf5172f090f4` (`address`),
  KEY `IDX_a5d73d7c2ecb6ed217f86d512e` (`city`),
  KEY `IDX_51aca98d352a95e83820546d8d` (`merchantId`),
  KEY `IDX_ee42cdb53b92dfe0e87bf6c30d` (`status`),
  KEY `IDX_e711512051a47d677f7c2dfb89` (`hasEverPublished`),
  CONSTRAINT `FK_51aca98d352a95e83820546d8dc` FOREIGN KEY (`merchantId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hotelId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roomTypeId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hotelName` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roomTypeName` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkIn` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkOut` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guestCount` int NOT NULL,
  `guestName` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guestPhone` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalAmount` decimal(12,2) NOT NULL,
  `inventoryDates` json DEFAULT NULL,
  `status` enum('PENDING','PAID','CANCELLED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_151b79a83ba240b0cb31b2302d` (`userId`),
  KEY `IDX_1ead9162c81324002f59508242` (`hotelId`),
  KEY `IDX_4acf1e1512c59b79075757d934` (`roomTypeId`),
  KEY `IDX_775c9f06fc27ae3ff8fb26f2c4` (`status`),
  KEY `IDX_30e6836e8539f85bfc47198067` (`userId`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `poi`;
CREATE TABLE `poi` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,6) DEFAULT NULL,
  `longitude` decimal(10,6) DEFAULT NULL,
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `baseScore` decimal(6,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_89b73c4e2f40270e8d0eb2c20b` (`name`,`city`,`type`),
  KEY `IDX_5176302ed375852aa4e9394d1b` (`city`),
  KEY `IDX_5a3a43efcbd9c282195330b0bc` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `room_types`;
CREATE TABLE `room_types` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hotelId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '房型名称',
  `basePrice` decimal(10,2) NOT NULL COMMENT '房型基础价格',
  `maxGuests` int DEFAULT NULL COMMENT '可住人数',
  `bedType` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '床型',
  `sortOrder` int NOT NULL DEFAULT '0' COMMENT '排序',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `stock` int DEFAULT NULL COMMENT '库存',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '房型图片',
  `isOnSale` tinyint DEFAULT NULL COMMENT '是否开售',
  `hasBreakfast` tinyint DEFAULT NULL COMMENT '含早',
  `refundable` tinyint DEFAULT NULL COMMENT '可退',
  `area` decimal(6,2) DEFAULT NULL COMMENT '房间面积(㎡)',
  `floor` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '楼层',
  `hasWindow` tinyint DEFAULT NULL COMMENT '有窗',
  PRIMARY KEY (`id`),
  KEY `IDX_7ed42fc166559badb3c937c400` (`hotelId`),
  CONSTRAINT `FK_7ed42fc166559badb3c937c400c` FOREIGN KEY (`hotelId`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户名（唯一）',
  `passwordHash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码哈希（不对外暴露）',
  `role` enum('CUSTOMER','MERCHANT','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER' COMMENT '用户角色',
  `avatarUrl` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头像URL',
  `preferredTagIds` json DEFAULT NULL COMMENT '商户常用标签ID',
  `preferredFacilityIds` json DEFAULT NULL COMMENT '商户常用设施ID',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱地址',
  `emailVerifyCode` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱验证码',
  `emailVerifyCodeExpiry` datetime DEFAULT NULL COMMENT '验证码过期时间',
  `emailVerifyFailCount` int DEFAULT '0' COMMENT '验证码验证失败次数',
  `emailVerifyFailLockUntil` datetime DEFAULT NULL COMMENT '验证码失败锁定截止时间',
  `lastEmailSentAt` datetime DEFAULT NULL COMMENT '上次发送邮件时间',
  `loginFailCount` int DEFAULT '0' COMMENT '登录失败次数',
  `loginFailLockUntil` datetime DEFAULT NULL COMMENT '登录失败锁定截止时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
