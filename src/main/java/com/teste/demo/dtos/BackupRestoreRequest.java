package com.teste.demo.dtos;

public class BackupRestoreRequest {

    private String filePath;

    public BackupRestoreRequest() {
    }

    public BackupRestoreRequest(String filePath) {
        this.filePath = filePath;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
}
