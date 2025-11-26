-- 强制清理旧表 (开发阶段用，上线后慎用)
DROP TABLE IF EXISTS photos;

-- 核心照片表
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 1. 物理存储信息
    r2_key TEXT NOT NULL,              -- R2 里的文件名 (例如: uuid.webp)
    original_name TEXT,                -- 用户上传时的文件名
    
    -- 2. 时空元数据 (EXIF)
    taken_at DATETIME,                 -- 拍摄时间
    latitude REAL,                     -- 纬度
    longitude REAL,                    -- 经度
    
    -- 3. AI 分析结果 (结构化存储)
    location_name TEXT,                -- AI 猜的地名
    country TEXT,                      -- 国家
    short_description TEXT,            -- 视觉描述
    historical_context TEXT,           -- 历史故事
    ai_tags_json TEXT,                 -- 标签数组 (SQLite存JSON字符串)
    
    -- 4. 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引 (DBA 的职业素养)
CREATE INDEX idx_photos_taken_at ON photos(taken_at);
CREATE INDEX idx_photos_geo ON photos(latitude, longitude);

-- 插入一条测试数据 (可选，用来验证查询)
INSERT INTO photos (r2_key, location_name, historical_context) 
VALUES ('test.jpg', 'DBA的控制台', '这是老码驹儿的第一块记忆碎片。');