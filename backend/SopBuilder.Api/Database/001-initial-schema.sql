-- SOP Builder - Initial Schema
-- Database: SOP_Builder
-- Run on FTPB1 SQL Server

USE [master];
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SOP_Builder')
BEGIN
    CREATE DATABASE [SOP_Builder];
END
GO

USE [SOP_Builder];
GO

-- ============================================
-- Users & Auth
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Users] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Role NVARCHAR(50) NOT NULL DEFAULT 'User',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT UQ_Users_Email UNIQUE (Email)
    );
END
GO

-- ============================================
-- API Keys for external access
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ApiKeys]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[ApiKeys] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL REFERENCES [dbo].[Users](Id),
        KeyHash NVARCHAR(255) NOT NULL,
        KeyPrefix NVARCHAR(10) NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Scopes NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        LastUsedAt DATETIME2 NULL
    );
END
GO

-- ============================================
-- SOP Definitions
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sops]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Sops] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Version INT NOT NULL DEFAULT 1,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
        DefinitionJson NVARCHAR(MAX) NOT NULL,
        CreatedBy INT NULL REFERENCES [dbo].[Users](Id),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- ============================================
-- Objects being processed through SOPs
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SopObjects]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[SopObjects] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SopId INT NOT NULL REFERENCES [dbo].[Sops](Id),
        ExternalId NVARCHAR(255) NULL,
        Name NVARCHAR(200) NOT NULL,
        Type NVARCHAR(100) NULL,
        CurrentNodeId NVARCHAR(100) NOT NULL,
        CurrentStatus NVARCHAR(200) NOT NULL,
        PropertiesJson NVARCHAR(MAX) NULL,
        IsComplete BIT NOT NULL DEFAULT 0,
        CreatedBy INT NULL REFERENCES [dbo].[Users](Id),
        ApiKeyId INT NULL REFERENCES [dbo].[ApiKeys](Id),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- ============================================
-- Documents attached during actions
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ObjectDocuments]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[ObjectDocuments] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ObjectId INT NOT NULL REFERENCES [dbo].[SopObjects](Id),
        ActionEdgeId NVARCHAR(100) NULL,
        FileName NVARCHAR(255) NOT NULL,
        FileType NVARCHAR(100) NULL,
        FilePath NVARCHAR(500) NULL,
        FileSize BIGINT NULL,
        UploadedBy INT NULL REFERENCES [dbo].[Users](Id),
        UploadedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- ============================================
-- Audit Trail
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditTrail]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[AuditTrail] (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        ObjectId INT NOT NULL REFERENCES [dbo].[SopObjects](Id),
        SopId INT NOT NULL REFERENCES [dbo].[Sops](Id),
        FromNodeId NVARCHAR(100) NULL,
        FromStatus NVARCHAR(200) NULL,
        ActionEdgeId NVARCHAR(100) NULL,
        ActionName NVARCHAR(200) NULL,
        ToNodeId NVARCHAR(100) NULL,
        ToStatus NVARCHAR(200) NULL,
        ActorUserId INT NULL REFERENCES [dbo].[Users](Id),
        ActorApiKeyId INT NULL REFERENCES [dbo].[ApiKeys](Id),
        ActorRole NVARCHAR(100) NULL,
        PropertiesSnapshot NVARCHAR(MAX) NULL,
        DocumentsAttached NVARCHAR(MAX) NULL,
        NotificationsSent NVARCHAR(MAX) NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE NONCLUSTERED INDEX IX_AuditTrail_ObjectId ON [dbo].[AuditTrail] (ObjectId);
    CREATE NONCLUSTERED INDEX IX_AuditTrail_SopId ON [dbo].[AuditTrail] (SopId);
    CREATE NONCLUSTERED INDEX IX_AuditTrail_CreatedAt ON [dbo].[AuditTrail] (CreatedAt);
END
GO

-- ============================================
-- Default admin user (password: SopBuilder123!)
-- BCrypt hash for SopBuilder123!
-- ============================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE Email = 'admin@sopbuilder.com')
BEGIN
    INSERT INTO [dbo].[Users] (Email, PasswordHash, Name, Role)
    VALUES ('admin@sopbuilder.com', '$2a$11$rKzFGqKJB0DhBZ9lHxJmZeQP5fR7rN3MZtJy0E1GkCx/IqvU6WqDy', 'Admin', 'Admin');
END
GO
