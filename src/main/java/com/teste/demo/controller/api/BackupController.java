package com.teste.demo.controller.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.teste.demo.dtos.BackupResponse;
import com.teste.demo.service.BackupService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/backup")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @PostMapping("/manual")
    public ResponseEntity<BackupResponse> backupManual() {
        try {
            String filePath = backupService.executarBackup();
            BackupResponse resp = new BackupResponse(
                    "Backup gerado com sucesso.",
                    filePath,
                    LocalDateTime.now()
            );
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    new BackupResponse(
                            "Falha ao gerar backup. Verifique os logs do servidor.",
                            null,
                            LocalDateTime.now()
                    )
            );
        }
    }
}

