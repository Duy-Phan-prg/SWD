package com.keycap.sbamonggo.repository;

import com.keycap.sbamonggo.entity.Student;


import java.util.List;

public interface IStudentRepository extends JpaRepository <Student, Integer> {


    public List<Student> findAll();

    public void save(Student student);

    public void delete(Student student);

    public Student findByEmail(String email);

    public Student update(String email, Student student);
}

