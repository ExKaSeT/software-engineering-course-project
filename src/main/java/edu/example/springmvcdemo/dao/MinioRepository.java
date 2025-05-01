package edu.example.springmvcdemo.dao;

import edu.example.springmvcdemo.dao.exception.FileReadException;
import edu.example.springmvcdemo.dao.exception.FileWriteException;
import io.minio.*;
import io.minio.errors.ErrorResponseException;
import io.minio.messages.Item;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.apache.commons.compress.utils.FileNameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MinioRepository {

    private static final int MAX_ATTEMPTS_TO_GEN_FILENAME = 3;

    @Value("${minio.bucket-name}")
    private String bucketName;

    private final MinioClient minioClient;

    @PostConstruct
    @SneakyThrows
    public void createBucket() {
        boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder()
                .bucket(bucketName)
                .build());

        if (!bucketExists) {
            minioClient.makeBucket(MakeBucketArgs.builder()
                    .bucket(bucketName).build());
        }
    }

    /**
     * Saves object (file) to storage.
     * All object are saved to one bucket (${minio.bucket-name})
     * @param objectName Name to save object by
     * @param size Object size (bytes)
     * @param object Object as a stream
     * @return Response, holding data about written object
     * @throws FileWriteException If a file writing error accrued (e.g. object with this name already exists in storage)
     */
    public ObjectWriteResponse saveObject(String objectName, Long size, InputStream object) throws FileWriteException {
        try {
            return minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(object, size, -1).build());
        } catch (Exception e) {
            throw new FileWriteException(e);
        }
    }

    public boolean isObjectExist(String objectName) {
        try {
            minioClient.statObject(StatObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName).build());
            return true;
        } catch (ErrorResponseException e) {
            return false;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public InputStream getObject(String objectName) throws FileReadException {
        try {
            return minioClient.getObject(GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName).build());
        } catch (Exception e) {
            throw new FileReadException(e);
        }
    }

    public void deleteObject(String objectName) throws FileWriteException {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            throw new FileWriteException(e);
        }
    }

    public List<String> getObjectList() {
        var iterable = minioClient.listObjects(ListObjectsArgs.builder()
                .bucket(bucketName).build());

        List<String> objectNameList = new LinkedList<>();
        for (Result<Item> result : iterable) {
            try {
                objectNameList.add(result.get().objectName());
            } catch (Exception ignored) {}
        }
        return objectNameList;
    }

    /**
     * Save file in the Minio storage with file extension as prefix
     * @param file file to save
     * @return generated file name
     */
    public String saveFile(MultipartFile file) throws FileWriteException {

        String fileExt = FileNameUtils.getExtension(file.getOriginalFilename());
        String generatedFileName = String.format("%s/%s", fileExt, UUID.randomUUID());

        int tryCount = 0;
        while (this.isObjectExist(generatedFileName)) {
            if (tryCount++ > MAX_ATTEMPTS_TO_GEN_FILENAME) {
                throw new RuntimeException("Unable to generate unique filename");
            }
            generatedFileName = String.format("%s/%s", fileExt, UUID.randomUUID());
        }
        try {
            this.saveObject(generatedFileName, file.getSize(), file.getInputStream());
        } catch (FileWriteException | IOException e) {
            throw new FileWriteException(e);
        }

        return generatedFileName;
    }

    public List<FileSaveResult> save(List<MultipartFile> files) throws FileWriteException {
        List<FileSaveResult> result = new ArrayList<>();
        for (var file : files) {
            try {
                result.add(new FileSaveResult(file.getOriginalFilename(), saveFile(file), file.getSize()));
            } catch (FileWriteException ex) {
                for (var saved : result) {
                    try {
                        this.deleteObject(saved.getSavedFilename());
                    } catch (FileWriteException ignored) {}
                }
                throw new FileWriteException(ex);
            }
        }
        return result;
    }

    @Data
    @AllArgsConstructor
    public static class FileSaveResult {
        private String originalName;
        private String savedFilename;
        private Long size;
    }
}
