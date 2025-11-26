-- Photos 表：存储照片元数据和 AI 分析结果
-- 注意：我们要存经纬度，SQLite 没有专门的 Spatial 类型，通常存为 REAL 或 JSON
CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    r2_key TEXT NOT NULL,           -- 图片在 R2 存储桶里的文件名 (或者是低清图路径)
    file_hash TEXT,                 -- 用于去重 (可选)
    
    -- EXIF 信息 (前端提取后传过来)
    taken_at DATETIME,              -- 拍摄时间
    latitude REAL,                  -- 纬度
    longitude REAL,                 -- 经度
    location_name TEXT,             -- 逆地理编码后的地名 (如 "Kyoto, Japan")
    lens_info TEXT,                 -- 镜头信息 (给摄影师看)

    -- AI 分析字段
    ai_description TEXT,            -- AI 识别出的画面描述 (Vision API 的结果)
    ai_tags TEXT,                   -- JSON 格式的标签 (例如 ["sunset", "temple"])
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stories 表：生成的游记/故事
CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content_markdown TEXT,          -- AI 生成的 Markdown 格式文章
    theme_style TEXT,               -- 风格 (如 "historical", "modern", "poetic")
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 关联表：因为一个故事可能包含多张照片
CREATE TABLE IF NOT EXISTS story_photos (
    story_id INTEGER,
    photo_id INTEGER,
    PRIMARY KEY (story_id, photo_id),
    FOREIGN KEY (story_id) REFERENCES stories(id),
    FOREIGN KEY (photo_id) REFERENCES photos(id)
);

-- 插入一条测试数据，验证一会能不能查出来
INSERT INTO photos (location_name, ai_description) 
VALUES ('测试地点: 故宫', '这是一条来自数据库的测试数据，证明连接成功！');