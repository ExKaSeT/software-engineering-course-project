package edu.example.springmvcdemo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.util.List;

@Entity
@Data
@Table(name = "images")
public class Image {
    /**
     Object name in storage
     */
    @Id
    @Column(name = "link", length = 50)
    private String link;

    /**
     Original filename
     */
    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "size")
    private Integer size;

    @ManyToMany
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JoinTable(
            name = "messages_images",
            joinColumns = @JoinColumn(name = "image_link"),
            inverseJoinColumns = @JoinColumn(name = "message_id"))
    private List<Message> messages;
}