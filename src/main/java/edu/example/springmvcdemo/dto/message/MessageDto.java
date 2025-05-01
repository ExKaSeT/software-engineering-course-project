package edu.example.springmvcdemo.dto.message;

import edu.example.springmvcdemo.dto.image.ImageDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageDto implements Serializable {
    private Long id;
    private String content;
    private LocalDateTime lastModifiedDate;
    private List<ImageDto> imageMetas;
}
