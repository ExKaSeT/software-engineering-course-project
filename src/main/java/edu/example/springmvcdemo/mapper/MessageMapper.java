package edu.example.springmvcdemo.mapper;

import edu.example.springmvcdemo.dto.message.MessageDto;
import edu.example.springmvcdemo.model.Message;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = ImageMapper.class)
public interface MessageMapper {

    @Mapping(source = "images", target = "imageMetas")
    MessageDto toMessageDto(Message message);
}
