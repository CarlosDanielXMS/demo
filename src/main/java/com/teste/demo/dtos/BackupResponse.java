package com.teste.demo.dtos;

import java.time.LocalDateTime;

public record BackupResponse(
        String message,
        String filePath,
        LocalDateTime createdAt
) {}
