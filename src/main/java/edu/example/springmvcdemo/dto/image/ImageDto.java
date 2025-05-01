package edu.example.springmvcdemo.dto.image;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImageDto implements Serializable {
    /**
     Original filename
     */
    private String name;
    private Integer size;
    /**
     Object name in storage
     */
    private String link;
}
