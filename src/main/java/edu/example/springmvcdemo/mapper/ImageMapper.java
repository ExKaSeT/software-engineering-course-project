package edu.example.springmvcdemo.mapper;

import edu.example.springmvcdemo.dto.image.ImageDto;
import edu.example.springmvcdemo.model.Image;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ImageMapper {

    ImageDto toImageDto(Image image);
}
