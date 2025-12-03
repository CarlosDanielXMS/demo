package com.teste.demo.controller.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.teste.demo.dtos.BackupResponse;
import com.teste.demo.dtos.BackupRestoreRequest;
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

    @PostMapping("/restore")
    public ResponseEntity<BackupResponse> restore(@RequestBody BackupRestoreRequest request) {
        try {
            if (request == null || request.getFilePath() == null || request.getFilePath().isBlank()) {
                return ResponseEntity.badRequest().body(
                        new BackupResponse(
                                "Caminho do arquivo de backup é obrigatório.",
                                null,
                                LocalDateTime.now()
                        )
                );
            }

            String msg = backupService.executarRestore(request.getFilePath());

            return ResponseEntity.ok(
                    new BackupResponse(
                            msg,
                            request.getFilePath(),
                            LocalDateTime.now()
                    )
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    new BackupResponse(
                            "Falha ao restaurar o backup. Verifique os logs do servidor.",
                            request != null ? request.getFilePath() : null,
                            LocalDateTime.now()
                    )
            );
        }
    }
}
