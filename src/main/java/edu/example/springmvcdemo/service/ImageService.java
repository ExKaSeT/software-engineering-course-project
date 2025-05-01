package edu.example.springmvcdemo.service;

import edu.example.springmvcdemo.dao.ImageRepository;
import edu.example.springmvcdemo.dao.MinioRepository;
import edu.example.springmvcdemo.dao.exception.FileReadException;
import edu.example.springmvcdemo.dto.image.ImageDto;
import edu.example.springmvcdemo.exception.EntityNotFoundException;
import edu.example.springmvcdemo.mapper.ImageMapper;
import edu.example.springmvcdemo.model.Image;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import static edu.example.springmvcdemo.model.Operation.OperationType.READ;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository imageRepository;
    private final MinioRepository minioRepository;
    private final ImageMapper imageMapper;
    private final OperationService operationService;

    @Cacheable(value = "ImageService::getImageMeta", key = "#link")
    public ImageDto getImageMeta(String link) {
        Image image = imageRepository.findByLink(link)
                .orElseThrow(() -> new EntityNotFoundException("Image not found"));

        operationService.logOperation(READ, "Read image meta with id: " + link);

        return imageMapper.toImageDto(image);
    }

    public InputStream getImage(String link) throws FileReadException {
        return minioRepository.getObject(link);
    }
}
