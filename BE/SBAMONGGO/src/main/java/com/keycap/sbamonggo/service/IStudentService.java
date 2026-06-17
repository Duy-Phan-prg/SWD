package com.keycap.sbamonggo.service;

import com.keycap.sbamonggo.entity.Student;

import java.util.List;

public interface IStudentService {

    public List<Student> findAll();

    public void save(Student student);

    public void delete(Student student);

    public Student findByEmail(String email);

    public Student update(String email, Student updatedStudent);
}
