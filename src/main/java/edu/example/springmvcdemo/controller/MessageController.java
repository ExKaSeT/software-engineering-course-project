package edu.example.springmvcdemo.controller;

import edu.example.springmvcdemo.dto.message.MessageDto;
import edu.example.springmvcdemo.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/message")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/{id}")
    public MessageDto getMessageById(@PathVariable Long id) {
        return messageService.getMessage(id);
    }

    @PostMapping
    public MessageDto sendMessage(@RequestPart("message") String content,
                               @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return messageService.createMessageWithFiles(content, files);
    }
}
