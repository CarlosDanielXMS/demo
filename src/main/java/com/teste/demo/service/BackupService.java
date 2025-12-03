package com.teste.demo.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class BackupService {

    private final JdbcTemplate jdbcTemplate;

    private static final String BACKUP_DIR =
            "C:\\Program Files\\Microsoft SQL Server\\MSSQL15.SQLEXPRESS\\MSSQL\\Backup\\";

    public BackupService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String executarBackup() {
        String dbName = "ProjetoInter4Sem";

        String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        String filePath = BACKUP_DIR + dbName + "_" + timestamp + ".bak";

        String backupName = "Backup manual " + dbName + " " + timestamp;

        String sql = "BACKUP DATABASE [" + dbName + "] " +
                     "TO DISK = '" + filePath + "' " +
                     "WITH INIT, NAME = '" + backupName + "', STATS = 10;";

        jdbcTemplate.execute(sql);

        return filePath;
    }

    public String executarRestore(String backupFilePath) {
        String dbName = "ProjetoInter4Sem";

        String sql = "ALTER DATABASE [" + dbName + "] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; " +
                "RESTORE DATABASE [" + dbName + "] FROM DISK = '" + backupFilePath + "' WITH REPLACE; " +
                "ALTER DATABASE [" + dbName + "] SET MULTI_USER;";

        jdbcTemplate.execute(sql);

        return "Restauração do banco de dados concluída a partir do arquivo: " + backupFilePath;
    }
}
