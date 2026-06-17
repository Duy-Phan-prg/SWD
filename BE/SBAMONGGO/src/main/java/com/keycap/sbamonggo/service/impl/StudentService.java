package com.keycap.sbamonggo.service.impl;

import com.keycap.sbamonggo.entity.Student;
import com.keycap.sbamonggo.repository.IStudentRepository;
import com.keycap.sbamonggo.repository.impl.StudentRepository;
import com.keycap.sbamonggo.service.IStudentService;

import java.util.List;

public class StudentService implements IStudentService {

    private IStudentRepository iStudentRepo;

    public StudentService() {
        iStudentRepo = new StudentRepository();
    }

    @Override
    public void save(Student student) {
        iStudentRepo.save(student);
    }

    @Override
    public List<Student> findAll() {
        return iStudentRepo.findAll();
    }

    @Override
    public void delete(Student student) {
        iStudentRepo.delete(student);
    }

    @Override
    public Student findByEmail(String email) {
        return iStudentRepo.findByEmail(email);
    }

    @Override
    public Student update(String email, Student updatedStudent) {
        Student existingStudent = iStudentRepo.findByEmail(email);
        if (existingStudent != null) {
            return iStudentRepo.update(email, updatedStudent);
        }
        return null;
    }


}
