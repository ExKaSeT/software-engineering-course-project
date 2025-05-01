package edu.example.springmvcdemo.service;

import edu.example.springmvcdemo.dao.MessageRepository;
import edu.example.springmvcdemo.dao.MinioRepository;
import edu.example.springmvcdemo.dao.exception.FileWriteException;
import edu.example.springmvcdemo.dto.message.MessageDto;
import edu.example.springmvcdemo.exception.EntityNotFoundException;
import edu.example.springmvcdemo.mapper.MessageMapper;
import edu.example.springmvcdemo.model.Image;
import edu.example.springmvcdemo.model.Message;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.List;

import static edu.example.springmvcdemo.model.Operation.OperationType.READ;
import static edu.example.springmvcdemo.model.Operation.OperationType.WRITE;
import static java.util.Objects.nonNull;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final MinioRepository minioRepository;
    private final MessageMapper messageMapper;
    private final OperationService operationService;

    @Cacheable(value = "MessageService::getMessage", key = "#id")
    public MessageDto getMessage(Long id) {
        var message = messageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        operationService.logOperation(READ, "Read message with id " + id);

        return messageMapper.toMessageDto(message);
    }

    public List<Message> getAllMessages() {
        return messageRepository.findAll();
    }

    public MessageDto createMessageWithFiles(String content, @Nullable List<MultipartFile> files) {
        var message = new Message();
        message.setContent(content);

        List<Image> images = new ArrayList<>();
        if (nonNull(files) && !files.isEmpty()) {
            try {
                var savedFiles = minioRepository.save(files);
                for (var savedFile : savedFiles) {
                    var file = new Image();
                    file.setName(savedFile.getOriginalName());
                    file.setLink(savedFile.getSavedFilename());
                    file.setSize(Math.toIntExact(savedFile.getSize()));
                    images.add(file);
                }
            } catch (FileWriteException e) {
                throw new RuntimeException(e);
            }
        }

        message.setImages(images);
        try {
            message = messageRepository.save(message);
        } catch (Throwable e) {
            message.getImages().forEach(it -> {
                try {
                    minioRepository.deleteObject(it.getLink());
                } catch (FileWriteException ignored) {}
            });
            throw e;
        }

        operationService.logOperation(WRITE, "Create message with id " + message.getId());

        return messageMapper.toMessageDto(message);
    }
}