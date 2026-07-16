package com.university.ums.util;

import com.university.ums.entity.McqQuestion;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses MCQ questions out of a plain-text representation of an uploaded
 * Word (.docx) or PDF file. Faculty are expected to format each question
 * roughly like:
 *
 *   1. What is the capital of France?
 *   A) Berlin
 *   B) Madrid
 *   C) Paris
 *   D) Rome
 *   Answer: C
 *
 * Numbering style (1. / 1) / Q1.), option markers (A) / A. / (A)) and the
 * "Answer:" / "Ans:" / "Correct Answer:" prefix are all tolerated, and
 * matching is case-insensitive.
 */
public final class McqDocumentParser {

    private McqDocumentParser() {}

    private static final Pattern QUESTION_LINE =
            Pattern.compile("^(?:Q(?:uestion)?\\.?\\s*)?\\d+[\\.\\)]\\s*(.+)$", Pattern.CASE_INSENSITIVE);

    private static final Pattern OPTION_LINE =
            Pattern.compile("^\\(?([A-Da-d])\\)?[\\.\\)\\-:]\\s*(.+)$");

    private static final Pattern ANSWER_LINE =
            Pattern.compile("^(?:Answer|Ans|Correct\\s*Answer|Correct)\\s*[:\\-]?\\s*\\(?([A-Da-d])\\)?\\.?\\s*$",
                    Pattern.CASE_INSENSITIVE);

    public static class ParsedQuestion {
        public String questionText;
        public final Map<String, String> options = new LinkedHashMap<>();
        public String correctOption;
    }

    /** Extract raw text from an uploaded .docx file. */
    public static String extractTextFromDocx(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (XWPFDocument doc = new XWPFDocument(in)) {
            for (XWPFParagraph p : doc.getParagraphs()) {
                sb.append(p.getText()).append('\n');
            }
        }
        return sb.toString();
    }

    /** Extract raw text from an uploaded .pdf file. */
    public static String extractTextFromPdf(InputStream in) throws IOException {
        try (PDDocument doc = PDDocument.load(in)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    /** Parse raw extracted text into a list of well-formed MCQ questions. */
    public static List<ParsedQuestion> parse(String rawText) {
        List<ParsedQuestion> result = new ArrayList<>();
        ParsedQuestion current = null;

        String[] lines = rawText.split("\\r?\\n");
        for (String rawLine : lines) {
            String line = rawLine.strip();
            if (line.isEmpty()) continue;

            Matcher ansM = ANSWER_LINE.matcher(line);
            if (ansM.matches() && current != null) {
                current.correctOption = ansM.group(1).toUpperCase();
                continue;
            }

            Matcher optM = OPTION_LINE.matcher(line);
            if (optM.matches() && current != null) {
                current.options.put(optM.group(1).toUpperCase(), optM.group(2).strip());
                continue;
            }

            Matcher qM = QUESTION_LINE.matcher(line);
            if (qM.matches()) {
                current = new ParsedQuestion();
                current.questionText = qM.group(1).strip();
                result.add(current);
                continue;
            }

            // Wrapped continuation line of the question text itself
            if (current != null && current.options.isEmpty()) {
                current.questionText += " " + line;
            }
        }

        // Keep only well-formed questions: at least 2 options, a correct answer
        // that actually matches one of the given options.
        result.removeIf(q -> q.options.size() < 2
                || q.correctOption == null
                || !q.options.containsKey(q.correctOption));
        return result;
    }

    /** Convert parsed questions into persistence-ready McqQuestion entities (not yet saved). */
    public static List<McqQuestion> toEntities(List<ParsedQuestion> parsed) {
        List<McqQuestion> out = new ArrayList<>();
        int order = 0;
        for (ParsedQuestion p : parsed) {
            McqQuestion q = new McqQuestion();
            q.setQuestionText(p.questionText);
            q.setOptionA(p.options.getOrDefault("A", "-"));
            q.setOptionB(p.options.getOrDefault("B", "-"));
            q.setOptionC(p.options.getOrDefault("C", "-"));
            q.setOptionD(p.options.getOrDefault("D", "-"));
            q.setCorrectOption(McqQuestion.Option.valueOf(p.correctOption));
            q.setMarks(1);
            q.setOrderIndex(order++);
            out.add(q);
        }
        return out;
    }
}
