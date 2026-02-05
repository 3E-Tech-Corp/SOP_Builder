-- SOP Builder - v2 Schema: List Codes, Document Types, Event-Driven Notifications
-- Database: SOP_Builder

USE [SOP_Builder];
GO

-- ============================================
-- List Codes (reusable option lists for select-type properties)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ListCodes]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[ListCodes] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT UQ_ListCodes_Name UNIQUE (Name)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ListCodeItems]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[ListCodeItems] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ListCodeId INT NOT NULL REFERENCES [dbo].[ListCodes](Id) ON DELETE CASCADE,
        Value NVARCHAR(200) NOT NULL,
        Label NVARCHAR(200) NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,

        CONSTRAINT UQ_ListCodeItems_Value UNIQUE (ListCodeId, Value)
    );

    CREATE NONCLUSTERED INDEX IX_ListCodeItems_ListCodeId ON [dbo].[ListCodeItems] (ListCodeId);
END
GO

-- ============================================
-- Document Types (centralized document type management)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentTypes]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[DocumentTypes] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT UQ_DocumentTypes_Name UNIQUE (Name)
    );
END
GO

-- Seed default document types
IF NOT EXISTS (SELECT 1 FROM [dbo].[DocumentTypes] WHERE Name = 'PDF')
BEGIN
    INSERT INTO [dbo].[DocumentTypes] (Name, Description) VALUES
        ('PDF', 'PDF document'),
        ('Image', 'Image file (PNG, JPG, etc.)'),
        ('Spreadsheet', 'Excel or CSV spreadsheet'),
        ('Document', 'Word or text document'),
        ('Contract', 'Legal contract'),
        ('Invoice', 'Invoice or billing document'),
        ('Receipt', 'Payment receipt'),
        ('Certificate', 'Certificate or credential'),
        ('Other', 'Other document type');
END
GO

-- ============================================
-- Event Types (event-driven notification system)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EventTypes]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[EventTypes] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(100) NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,

        CONSTRAINT UQ_EventTypes_Code UNIQUE (Code)
    );
END
GO

-- Seed common event types
IF NOT EXISTS (SELECT 1 FROM [dbo].[EventTypes] WHERE Code = 'object_created')
BEGIN
    INSERT INTO [dbo].[EventTypes] (Code, Name, Description) VALUES
        ('object_created', 'Object Created', 'Fired when a new object enters the SOP'),
        ('status_changed', 'Status Changed', 'Fired when an object moves to a new status node'),
        ('action_completed', 'Action Completed', 'Fired when an action/edge transition is executed'),
        ('object_completed', 'Object Completed', 'Fired when an object reaches an End node'),
        ('document_uploaded', 'Document Uploaded', 'Fired when a document is attached to an object'),
        ('sla_warning', 'SLA Warning', 'Fired when an object approaches its SLA deadline'),
        ('sla_breached', 'SLA Breached', 'Fired when an object exceeds its SLA deadline');
END
GO

-- ============================================
-- Notification Rules (map events to notification channels)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NotificationRules]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[NotificationRules] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        EventTypeCode NVARCHAR(100) NOT NULL,
        Channel NVARCHAR(50) NOT NULL,
        Template NVARCHAR(MAX) NOT NULL,
        Recipients NVARCHAR(500) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_NotificationRules_EventType
            FOREIGN KEY (EventTypeCode) REFERENCES [dbo].[EventTypes](Code)
    );

    CREATE NONCLUSTERED INDEX IX_NotificationRules_EventTypeCode ON [dbo].[NotificationRules] (EventTypeCode);
END
GO
