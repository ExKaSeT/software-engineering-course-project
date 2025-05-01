package edu.example.springmvcdemo.controller;

import edu.example.springmvcdemo.dao.exception.FileReadException;
import edu.example.springmvcdemo.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import static java.util.Objects.isNull;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final ImageService imageService;

    @GetMapping
    public ResponseEntity<Resource> getFile(@RequestParam String link) throws FileReadException {
        var file = imageService.getImageMeta(link);

        InputStream fileInputStream = imageService.getImage(link);
        if (isNull(fileInputStream)) {
            return ResponseEntity.notFound().build();
        }

        InputStreamResource resource = new InputStreamResource(fileInputStream);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" +
                        URLEncoder.encode(file.getName(), StandardCharsets.UTF_8) + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}