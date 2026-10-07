-- Deterministic P1 fixture for an isolated test database only.
-- All identities, contact details and credentials are synthetic.
-- Test password for every fixture user: TestOnly!2026

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

DELETE FROM `hotel_facilities`;
DELETE FROM `hotel_tags`;
DELETE FROM `hotel_poi`;
DELETE FROM `hotel_images`;
DELETE FROM `calendar_price`;
DELETE FROM `calendar_stock`;
DELETE FROM `hotel_audit_records`;
DELETE FROM `orders`;
DELETE FROM `room_types`;
DELETE FROM `banners`;
DELETE FROM `poi`;
DELETE FROM `facilities`;
DELETE FROM `hotels`;
DELETE FROM `users`;

INSERT INTO `users` (`id`, `username`, `passwordHash`, `role`, `email`) VALUES
  ('00000000-0000-4000-8000-000000000001', 'fixture_customer', '$2a$10$1..T95nFnk5B7Azf1ZKD4e0wI9iPsHWlsf3hCLaGATtjbAxekKfki', 'CUSTOMER', 'customer@example.test'),
  ('00000000-0000-4000-8000-000000000002', 'fixture_merchant_a', '$2a$10$1..T95nFnk5B7Azf1ZKD4e0wI9iPsHWlsf3hCLaGATtjbAxekKfki', 'MERCHANT', 'merchant-a@example.test'),
  ('00000000-0000-4000-8000-000000000003', 'fixture_merchant_b', '$2a$10$1..T95nFnk5B7Azf1ZKD4e0wI9iPsHWlsf3hCLaGATtjbAxekKfki', 'MERCHANT', 'merchant-b@example.test'),
  ('00000000-0000-4000-8000-000000000004', 'fixture_admin', '$2a$10$1..T95nFnk5B7Azf1ZKD4e0wI9iPsHWlsf3hCLaGATtjbAxekKfki', 'ADMIN', 'admin@example.test');

INSERT INTO `facilities` (`id`, `name`, `enabled`, `type`, `category`) VALUES
  ('30000000-0000-4000-8000-000000000001', '测试免费 WiFi', 1, 'FACILITY', 'BASIC'),
  ('30000000-0000-4000-8000-000000000002', '测试停车场', 1, 'FACILITY', 'BASIC'),
  ('30000000-0000-4000-8000-000000000003', '测试亲子友好', 1, 'TAG', 'OTHER'),
  ('30000000-0000-4000-8000-000000000004', '测试已禁用设施', 0, 'FACILITY', 'ROOM');

INSERT INTO `hotels` (`id`, `nameZh`, `nameEn`, `hotelID`, `address`, `latitude`, `longitude`, `city`, `starLevel`, `miniPrice`, `favoriteCount`, `openSince`, `nearby`, `discountInfo`, `rejectReason`, `merchantId`, `status`, `score`, `hasEverPublished`) VALUES
  ('10000000-0000-4000-8000-000000000001', '测试已发布酒店', 'Fixture Published Hotel', 'HTFIXTURE0001', '测试路 1 号', 31.230400, 121.473700, '310100', 5, 199.00, 10, '2020-01-01', JSON_ARRAY('测试地铁站'), '测试优惠', NULL, '00000000-0000-4000-8000-000000000002', 3, 4.80, 1),
  ('10000000-0000-4000-8000-000000000002', '测试草稿酒店', 'Fixture Draft Hotel', 'HTFIXTURE0002', '测试路 2 号', 31.220000, 121.460000, '310100', 3, 0.00, 0, '2021-02-01', NULL, NULL, NULL, '00000000-0000-4000-8000-000000000002', 0, 0.00, 0),
  ('10000000-0000-4000-8000-000000000003', '测试审核中酒店', 'Fixture Reviewing Hotel', 'HTFIXTURE0003', '测试路 3 号', 39.904200, 116.407400, '110100', 4, 299.00, 5, '2019-03-01', NULL, NULL, NULL, '00000000-0000-4000-8000-000000000002', 1, 4.20, 0),
  ('10000000-0000-4000-8000-000000000004', '测试驳回酒店', 'Fixture Rejected Hotel', 'HTFIXTURE0004', '测试路 4 号', 39.914200, 116.417400, '110100', 4, 259.00, 2, '2018-04-01', NULL, NULL, '测试资料不完整', '00000000-0000-4000-8000-000000000003', 2, 3.90, 0),
  ('10000000-0000-4000-8000-000000000005', '测试已下线酒店', 'Fixture Offline Hotel', 'HTFIXTURE0005', '测试路 5 号', 30.274100, 120.155100, '330100', 5, 399.00, 8, '2017-05-01', NULL, NULL, NULL, '00000000-0000-4000-8000-000000000003', 4, 4.60, 1);

INSERT INTO `hotel_facilities` (`hotelId`, `facilityId`) VALUES
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002');

INSERT INTO `hotel_tags` (`hotelId`, `tagId`) VALUES
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003');

INSERT INTO `hotel_images` (`id`, `hotelId`, `url`, `sortOrder`) VALUES
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'https://example.test/hotel/published-1.jpg', 0),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'https://example.test/hotel/published-2.jpg', 1);

INSERT INTO `room_types` (`id`, `hotelId`, `name`, `basePrice`, `maxGuests`, `bedType`, `sortOrder`, `stock`, `images`, `isOnSale`, `hasBreakfast`, `refundable`, `area`, `floor`, `hasWindow`) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '测试标准房', 199.00, 2, '大床', 0, 2, JSON_ARRAY('https://example.test/room/standard.jpg'), 1, 1, 1, 28.00, '3-5层', 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '测试售罄房', 299.00, 2, '双床', 1, 0, NULL, 1, 0, 0, 32.00, '6层', 1),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '测试停售房', 399.00, 3, '大床', 2, 5, NULL, 0, 1, 1, 40.00, '7层', 1);

INSERT INTO `calendar_price` (`id`, `roomTypeId`, `date`, `price`) VALUES
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '2028-02-28', 219.00),
  ('60000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '2028-02-29', 229.00),
  ('60000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '2028-03-01', 239.00);

INSERT INTO `calendar_stock` (`id`, `roomTypeId`, `date`, `stock`) VALUES
  ('61000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '2028-02-28', 2),
  ('61000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '2028-02-29', 1),
  ('61000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '2028-03-01', 0);

INSERT INTO `poi` (`id`, `name`, `city`, `type`, `latitude`, `longitude`, `address`, `baseScore`) VALUES
  ('50000000-0000-4000-8000-000000000001', '测试地铁站', '310100', 'TRANSPORT', 31.231000, 121.474000, '测试路地铁口', 95.00),
  ('50000000-0000-4000-8000-000000000002', '测试景点', '310100', 'ATTRACTION', 31.232000, 121.475000, '测试景点路', 88.00);

INSERT INTO `hotel_poi` (`id`, `hotelId`, `poiId`) VALUES
  ('51000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001');

INSERT INTO `hotel_audit_records` (`id`, `hotelId`, `action`, `reason`, `operatorId`, `createdAt`) VALUES
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'SUBMIT', NULL, '00000000-0000-4000-8000-000000000002', '2026-10-01 01:00:00'),
  ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'PUBLISH', NULL, '00000000-0000-4000-8000-000000000004', '2026-10-01 02:00:00'),
  ('70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004', 'REJECT', '测试资料不完整', '00000000-0000-4000-8000-000000000004', '2026-10-02 02:00:00');

INSERT INTO `orders` (`id`, `userId`, `hotelId`, `roomTypeId`, `hotelName`, `roomTypeName`, `checkIn`, `checkOut`, `guestCount`, `guestName`, `guestPhone`, `totalAmount`, `inventoryDates`, `status`, `createdAt`) VALUES
  ('80000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '测试已发布酒店', '测试标准房', '2028-02-28', '2028-03-01', 2, '测试顾客', '13800000000', 448.00, JSON_ARRAY('2028-02-28', '2028-02-29'), 'PENDING', '2026-10-03 01:00:00'),
  ('80000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '测试已发布酒店', '测试标准房', '2028-02-28', '2028-03-01', 1, '测试顾客', '13800000000', 448.00, JSON_ARRAY('2028-02-28', '2028-02-29'), 'CANCELLED', '2026-10-02 01:00:00'),
  ('80000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '测试已发布酒店', '测试标准房', '2028-03-02', '2028-03-03', 1, '测试顾客', '13800000000', 199.00, NULL, 'PAID', '2026-10-01 01:00:00'),
  ('80000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '测试已发布酒店', '测试标准房', '2026-01-01', '2026-01-02', 1, '测试顾客', '13800000000', 199.00, NULL, 'COMPLETED', '2026-01-02 01:00:00');

INSERT INTO `banners` (`id`, `title`, `imageUrl`, `targetHotelId`, `enabled`, `sort`) VALUES
  ('90000000-0000-4000-8000-000000000001', '测试有效 Banner', 'https://example.test/banner/enabled.jpg', '10000000-0000-4000-8000-000000000001', 1, 0),
  ('90000000-0000-4000-8000-000000000002', '测试禁用 Banner', 'https://example.test/banner/disabled.jpg', '10000000-0000-4000-8000-000000000001', 0, 1);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
