package com.university.ums.config;

import com.university.ums.entity.*;
import com.university.ums.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final NoteRepository noteRepository;
    private final AssignmentRepository assignmentRepository;
    private final McqExamRepository mcqExamRepository;
    private final McqQuestionRepository mcqQuestionRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final FeeReminderRepository feeReminderRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final AnnouncementRepository announcementRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Only seed if DB is empty
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping.");
            return;
        }

        log.info("Seeding database with sample data...");

        // ── 1. Admin user ─────────────────────────────────────
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(User.Role.ADMIN);
        userRepository.save(admin);

        // ── 2. Departments ────────────────────────────────────
        Department cs = new Department();
        cs.setName("Computer Science");
        cs.setCode("CS");
        cs.setDescription("Department of Computer Science and Engineering");
        departmentRepository.save(cs);

        Department me = new Department();
        me.setName("Mechanical Engineering");
        me.setCode("ME");
        me.setDescription("Department of Mechanical Engineering");
        departmentRepository.save(me);

        Department ec = new Department();
        ec.setName("Electronics & Communication");
        ec.setCode("EC");
        ec.setDescription("Department of Electronics and Communication Engineering");
        departmentRepository.save(ec);

        // ── 3. Faculty ────────────────────────────────────────
        Faculty f1 = new Faculty();
        f1.setEmployeeId("FAC-2024-001");
        f1.setName("Dr. Anjali Sharma");
        f1.setEmail("anjali.sharma@university.edu");
        f1.setPhone("9876543210");
        f1.setGender(Gender.FEMALE);
        f1.setDesignation(Faculty.Designation.PROFESSOR);
        f1.setQualification("Ph.D Computer Science");
        f1.setSpecialization("Machine Learning");
        f1.setIsMentor(true);
        f1.setJoiningDate(LocalDate.of(2015, 7, 1));
        f1.setDepartment(cs);
        facultyRepository.save(f1);

        Faculty f2 = new Faculty();
        f2.setEmployeeId("FAC-2024-002");
        f2.setName("Prof. Ravi Kumar");
        f2.setEmail("ravi.kumar@university.edu");
        f2.setPhone("9876543211");
        f2.setGender(Gender.MALE);
        f2.setDesignation(Faculty.Designation.ASSOCIATE_PROFESSOR);
        f2.setQualification("M.Tech Computer Science");
        f2.setSpecialization("Database Systems");
        f2.setJoiningDate(LocalDate.of(2018, 8, 1));
        f2.setDepartment(cs);
        facultyRepository.save(f2);

        // Faculty user accounts
        User facultyUser1 = new User();
        facultyUser1.setUsername("anjali.sharma");
        facultyUser1.setPassword(passwordEncoder.encode("faculty123"));
        facultyUser1.setRole(User.Role.FACULTY);
        facultyUser1.setFaculty(f1);
        userRepository.save(facultyUser1);

        // NOTE: f2 (Ravi Kumar) is intentionally NOT a mentor by default — this lets you
        // demonstrate the "only mentor faculty can mark attendance" behavior end-to-end:
        // log in as ravi.kumar, confirm attendance is view-only, then as admin flip his
        // mentor toggle on in Faculty Management, and see it take effect immediately.
        User facultyUser2 = new User();
        facultyUser2.setUsername("ravi.kumar");
        facultyUser2.setPassword(passwordEncoder.encode("faculty123"));
        facultyUser2.setRole(User.Role.FACULTY);
        facultyUser2.setFaculty(f2);
        userRepository.save(facultyUser2);

        // ── 4. Courses ────────────────────────────────────────
        Course dbms = new Course();
        dbms.setCourseCode("CS301");
        dbms.setTitle("Database Management Systems");
        dbms.setCredits(4);
        dbms.setSemester(3);
        dbms.setType(Course.CourseType.THEORY);
        dbms.setMaxStudents(60);
        dbms.setDepartment(cs);
        dbms.setFaculty(f2);
        courseRepository.save(dbms);

        Course ml = new Course();
        ml.setCourseCode("CS401");
        ml.setTitle("Machine Learning");
        ml.setCredits(4);
        ml.setSemester(4);
        ml.setType(Course.CourseType.THEORY);
        ml.setMaxStudents(50);
        ml.setDepartment(cs);
        ml.setFaculty(f1);
        courseRepository.save(ml);

        // ── 5. Students ───────────────────────────────────────
        Student s1 = new Student();
        s1.setRollNumber("CS-2024-001");
        s1.setName("Arjun Mehta");
        s1.setEmail("arjun.mehta@student.university.edu");
        s1.setPhone("9876501001");
        s1.setGender(Gender.MALE);
        s1.setDateOfBirth(LocalDate.of(2003, 5, 15));
        s1.setSemester(3);
        s1.setAdmissionYear(2022);
        s1.setDepartment(cs);
        studentRepository.save(s1);

        Student s2 = new Student();
        s2.setRollNumber("CS-2024-002");
        s2.setName("Priya Nair");
        s2.setEmail("priya.nair@student.university.edu");
        s2.setPhone("9876501002");
        s2.setGender(Gender.FEMALE);
        s2.setDateOfBirth(LocalDate.of(2003, 9, 22));
        s2.setSemester(3);
        s2.setAdmissionYear(2022);
        s2.setDepartment(cs);
        studentRepository.save(s2);

        // Student user accounts
        User studentUser1 = new User();
        studentUser1.setUsername("arjun.mehta");
        studentUser1.setPassword(passwordEncoder.encode("student123"));
        studentUser1.setRole(User.Role.STUDENT);
        studentUser1.setStudent(s1);
        userRepository.save(studentUser1);

        User studentUser2 = new User();
        studentUser2.setUsername("priya.nair");
        studentUser2.setPassword(passwordEncoder.encode("student123"));
        studentUser2.setRole(User.Role.STUDENT);
        studentUser2.setStudent(s2);
        userRepository.save(studentUser2);

        // ── 6. Accounts (fee management) user ──────────────────
        User accountsUser = new User();
        accountsUser.setUsername("accounts");
        accountsUser.setPassword(passwordEncoder.encode("accounts123"));
        accountsUser.setRole(User.Role.ACCOUNTS);
        userRepository.save(accountsUser);

        // ── 7. Enrollments ──────────────────────────────────────
        Enrollment e1 = new Enrollment();
        e1.setStudent(s1);
        e1.setCourse(dbms);
        enrollmentRepository.save(e1);

        Enrollment e2 = new Enrollment();
        e2.setStudent(s1);
        e2.setCourse(ml);
        enrollmentRepository.save(e2);

        Enrollment e3 = new Enrollment();
        e3.setStudent(s2);
        e3.setCourse(dbms);
        enrollmentRepository.save(e3);

        Enrollment e4 = new Enrollment();
        e4.setStudent(s2);
        e4.setCourse(ml);
        enrollmentRepository.save(e4);

        // ── 8. Course modules (subject-wise organization for notes/assignments/MCQ) ──
        CourseModule dbmsMod1 = new CourseModule();
        dbmsMod1.setTitle("Module 1: ER Modeling & Relational Design");
        dbmsMod1.setDescription("Entity-relationship diagrams, keys, normalization basics");
        dbmsMod1.setOrderIndex(1);
        dbmsMod1.setCourse(dbms);
        courseModuleRepository.save(dbmsMod1);

        CourseModule dbmsMod2 = new CourseModule();
        dbmsMod2.setTitle("Module 2: Transactions & Concurrency Control");
        dbmsMod2.setDescription("ACID properties, locking, isolation levels");
        dbmsMod2.setOrderIndex(2);
        dbmsMod2.setCourse(dbms);
        courseModuleRepository.save(dbmsMod2);

        CourseModule mlMod1 = new CourseModule();
        mlMod1.setTitle("Module 1: Introduction to Machine Learning");
        mlMod1.setDescription("Supervised vs unsupervised learning, key terminology");
        mlMod1.setOrderIndex(1);
        mlMod1.setCourse(ml);
        courseModuleRepository.save(mlMod1);

        // ── 9. Notes (module-wise, file URL based) ─────────────
        Note note1 = new Note();
        note1.setTitle("ER Modeling — Lecture Slides");
        note1.setDescription("Complete slide deck covering entity types, relationships and cardinality");
        note1.setFileUrl("https://drive.google.com/drive/folders/example-dbms-module1-notes");
        note1.setModule(dbmsMod1);
        note1.setUploadedBy(f2);
        noteRepository.save(note1);

        Note note2 = new Note();
        note2.setTitle("Introduction to ML — Reading Material");
        note2.setDescription("Chapter 1 & 2 from the reference textbook plus supplementary notes");
        note2.setFileUrl("https://drive.google.com/drive/folders/example-ml-module1-notes");
        note2.setModule(mlMod1);
        note2.setUploadedBy(f1);
        noteRepository.save(note2);

        // ── 10. Assignment (URL-based, students submit a link back) ──
        Assignment assignment1 = new Assignment();
        assignment1.setTitle("ER Diagram Design Exercise");
        assignment1.setDescription("Design an ER diagram for a library management system and submit as a PDF/Drive link.");
        assignment1.setResourceUrl("https://drive.google.com/file/d/example-assignment-brief");
        assignment1.setDeadline(LocalDate.now().plusDays(10).atTime(23, 59));
        assignment1.setMaxMarks(50);
        assignment1.setModule(dbmsMod1);
        assignment1.setCreatedBy(f2);
        assignmentRepository.save(assignment1);

        // ── 11. MCQ exam with auto-graded questions ────────────
        McqExam mcqExam1 = new McqExam();
        mcqExam1.setTitle("Module 1 Quiz — ER Modeling Basics");
        mcqExam1.setDurationMinutes(20);
        mcqExam1.setIsPublished(true);
        mcqExam1.setModule(dbmsMod1);
        mcqExam1.setCreatedBy(f2);
        mcqExamRepository.save(mcqExam1);

        McqQuestion q1 = new McqQuestion();
        q1.setMcqExam(mcqExam1);
        q1.setQuestionText("Which of the following best represents a real-world object in ER modeling?");
        q1.setOptionA("Attribute");
        q1.setOptionB("Entity");
        q1.setOptionC("Relationship");
        q1.setOptionD("Cardinality");
        q1.setCorrectOption(McqQuestion.Option.B);
        q1.setMarks(1);
        q1.setOrderIndex(1);

        McqQuestion q2 = new McqQuestion();
        q2.setMcqExam(mcqExam1);
        q2.setQuestionText("A primary key must always be:");
        q2.setOptionA("Unique and non-null");
        q2.setOptionB("A composite of all attributes");
        q2.setOptionC("Numeric only");
        q2.setOptionD("Optional");
        q2.setCorrectOption(McqQuestion.Option.A);
        q2.setMarks(1);
        q2.setOrderIndex(2);

        McqQuestion q3 = new McqQuestion();
        q3.setMcqExam(mcqExam1);
        q3.setQuestionText("Which normal form eliminates transitive dependency?");
        q3.setOptionA("1NF");
        q3.setOptionB("2NF");
        q3.setOptionC("3NF");
        q3.setOptionD("BCNF");
        q3.setCorrectOption(McqQuestion.Option.C);
        q3.setMarks(1);
        q3.setOrderIndex(3);

        mcqQuestionRepository.saveAll(List.of(q1, q2, q3));

        // ── 12. Fee structure, invoice & a partial payment ─────
        FeeStructure feeStructure = new FeeStructure();
        feeStructure.setAcademicYear("2025-2026");
        feeStructure.setSemester(3);
        feeStructure.setTotalAmount(75000.0);
        feeStructure.setDescription("Semester 3 tuition + lab fees");
        feeStructure.setDepartment(cs);
        feeStructureRepository.save(feeStructure);

        Invoice invoice1 = new Invoice();
        invoice1.setStudent(s1);
        invoice1.setFeeStructure(feeStructure);
        invoice1.setInvoiceNumber("INV-2026-00001");
        invoice1.setAcademicYear("2025-2026");
        invoice1.setSemester(3);
        invoice1.setAmountDue(75000.0);
        invoice1.setAmountPaid(25000.0);
        invoice1.setDueDate(LocalDate.now().plusDays(30));
        invoice1.setStatus(Invoice.Status.PARTIAL);
        invoiceRepository.save(invoice1);

        Payment payment1 = new Payment();
        payment1.setInvoice(invoice1);
        payment1.setAmount(25000.0);
        payment1.setReceiptNumber("RCPT-2026-00001");
        payment1.setPaymentDate(LocalDate.now().minusDays(5));
        payment1.setMethod(Payment.Method.UPI);
        payment1.setTransactionRef("UPI-DEMO-TXN-001");
        payment1.setReceivedBy("accounts");
        paymentRepository.save(payment1);

        Invoice invoice2 = new Invoice();
        invoice2.setStudent(s2);
        invoice2.setFeeStructure(feeStructure);
        invoice2.setInvoiceNumber("INV-2026-00002");
        invoice2.setAcademicYear("2025-2026");
        invoice2.setSemester(3);
        invoice2.setAmountDue(75000.0);
        invoice2.setAmountPaid(0.0);
        invoice2.setDueDate(LocalDate.now().plusDays(30));
        invoice2.setStatus(Invoice.Status.PENDING);
        invoiceRepository.save(invoice2);

        FeeReminder reminder1 = new FeeReminder();
        reminder1.setInvoice(invoice2);
        reminder1.setStudent(s2);
        reminder1.setMessage("Reminder: your Semester 3 fee of ₹75,000 is due within 30 days. " +
                "Please clear your balance at the earliest to avoid late fees.");
        reminder1.setSentBy("accounts");
        reminder1.setIsRead(false);
        feeReminderRepository.save(reminder1);

        // ── 13. Academic calendar events ────────────────────────
        CalendarEvent cal1 = new CalendarEvent();
        cal1.setTitle("Mid-Semester Examinations Begin");
        cal1.setDescription("Mid-sem exams for all semesters");
        cal1.setEventDate(LocalDate.now().plusDays(20));
        cal1.setType(CalendarEvent.EventType.EXAM);
        cal1.setCreatedBy("admin");
        calendarEventRepository.save(cal1);

        CalendarEvent cal2 = new CalendarEvent();
        cal2.setTitle("Independence Day");
        cal2.setDescription("National holiday — campus closed");
        cal2.setEventDate(LocalDate.of(LocalDate.now().getYear(), 8, 15));
        cal2.setType(CalendarEvent.EventType.HOLIDAY);
        cal2.setCreatedBy("admin");
        calendarEventRepository.save(cal2);

        CalendarEvent cal3 = new CalendarEvent();
        cal3.setTitle("ER Diagram Assignment Deadline");
        cal3.setDescription("Last date to submit the ER diagram design exercise (DBMS)");
        cal3.setEventDate(assignment1.getDeadline().toLocalDate());
        cal3.setType(CalendarEvent.EventType.DEADLINE);
        cal3.setCreatedBy("ravi.kumar");
        calendarEventRepository.save(cal3);

        // ── 14. Announcements / notice board ───────────────────
        Announcement ann1 = new Announcement();
        ann1.setTitle("Welcome to the new semester!");
        ann1.setMessage("Classes for Semester 3 & 4 begin Monday. Please check your timetable and course modules.");
        ann1.setTargetRole(Announcement.TargetRole.ALL);
        ann1.setPriority(Announcement.Priority.MEDIUM);
        ann1.setPostedBy("admin");
        announcementRepository.save(ann1);

        Announcement ann2 = new Announcement();
        ann2.setTitle("Fee payment deadline approaching");
        ann2.setMessage("Semester 3 fee payment is due within 30 days. Pay online or visit the Accounts office.");
        ann2.setTargetRole(Announcement.TargetRole.STUDENT);
        ann2.setPriority(Announcement.Priority.HIGH);
        ann2.setPostedBy("accounts");
        announcementRepository.save(ann2);

        log.info("✅ Seeding complete!");
        log.info("─────────────────────────────────────────────────────────");
        log.info("Admin login    → username: admin         | password: admin123");
        log.info("Faculty login  → username: anjali.sharma | password: faculty123  (mentor — can mark attendance)");
        log.info("Faculty login  → username: ravi.kumar    | password: faculty123  (NOT a mentor — view-only attendance)");
        log.info("Student login  → username: arjun.mehta   | password: student123");
        log.info("Student login  → username: priya.nair    | password: student123");
        log.info("Accounts login → username: accounts      | password: accounts123");
        log.info("─────────────────────────────────────────────────────────");
    }
}
