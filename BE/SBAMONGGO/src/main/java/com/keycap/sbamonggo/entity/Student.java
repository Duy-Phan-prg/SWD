package com.keycap.sbamonggo.entity;

public class Student {

    private int id;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private int marks;

    public Student() {
        super();
    }

    public Student(String firstName, String lastName, int marks) {
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.marks = marks;
    }

    public Student(String email, String password, String firstName, String lastName, int marks) {
        super();
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.marks = marks;
    }

    public Student(int id, String email, String password, String firstName, String lastName, int marks) {
        super();
        this.id = id;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.marks = marks;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }


    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }


    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }


    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }


    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }


    public int getMarks() {
        return marks;
    }

    public void setMarks(int marks) {
        this.marks = marks;
    }


    @Override
    public String toString() {
        return "Student{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", password='" + password + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", marks=" + marks +
                '}';
    }

}
