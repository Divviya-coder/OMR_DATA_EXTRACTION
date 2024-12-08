const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

async function processQuestions(questions, answerKeydata) {
    const answerKey = JSON.parse(answerKeydata)
    const results = [];
    // console.log(answerKey?.length, 'answer keys')
    // console.log(answerKeydata?.length, answerKeydata)
    // console.log(answerKey)

    questions.forEach(candidate => {
        const totalQuestions = answerKey.length;
        let attendedQuestions = 0;
        let totalCorrect = 0;
        let totalWrong = 0;
        let totalLeft = 0;
        console.log(answerKey, 'answer key')
        const answers = {};
        // console.log(candidate, 'candidate', totalQuestions, 'total questions')
        for (let i = 1; i <= totalQuestions; i++) {
            const candidateAnswer = candidate[`q${i}`] || '';
            const correctAnswer = answerKey?.[i - 1]?.Answers;
            // console.log(answerKey?.[i]?.Answers, 'answer keys', answerKey.find(q => q[i] === i))
            // console.log(candidateAnswer, 'candidate answer')
            answers[`q${i}`] = candidateAnswer;
            // console.log(i, candidateAnswer, correctAnswer, answerKey?.[i - 1], i, i - 1, i + 1)

            if (candidateAnswer === '') {
                totalLeft++;
            } else {
                attendedQuestions++;
                // console.log(candidateAnswer, 'candidate answer', correctAnswer, 'correct answer')
                if (candidateAnswer?.toLowerCase() === correctAnswer?.toLowerCase()) {
                    totalCorrect++;
                    // console.log(totalCorrect, candidateAnswer, correctAnswer, questions[candidate])
                } else {
                    totalWrong++;
                }
            }
        }

        const totalMark = (totalCorrect * 2) - (totalWrong * 0.66);
        const percentage = attendedQuestions === 0 ? 0 : ((totalCorrect / totalQuestions) * 100).toFixed(2);

        const [day, month, year] = [
            candidate.DateofBirth.substring(0, 2),
            candidate.DateofBirth.substring(2, 4),
            candidate.DateofBirth.substring(4)
        ];
        // console.log(answers, 'answers')
        results.push({
            candidateid: candidate.hallticket_No,
            candidatename: candidate.Name,
            birthday: day,
            birthmonth: month,
            birthyear: year,
            mobilenumber: candidate.phoneNumber,
            totalQuestions,
            attendedQuestions,
            totalLeft,
            totalCorrect,
            totalWrong,
            totalMark,
            percentage: Number(percentage),
            rank: 0, // Placeholder for rank calculation
            answers
            // {
            //     q1: 'C',
            //     q2: 'C',
            //     q3: 'D',
            //     q4: 'C',
            //     q5: '',
            //     q6: 'C',
            //     q7: '',
            //     q8: 'A',
            //     q9: 'B',
            //     q10: 'A',
            //     q11: 'D',
            //     q12: 'A',
            //     q13: 'B',
            //     q14: 'D',
            //     q15: 'B',
            //     q16: '',
            //     q17: 'D',
            //     q18: 'B',
            //     q19: 'D',
            //     q20: 'D',
            //     q21: 'D',
            //     q22: '',
            //     q23: 'A',
            //     q24: 'C',
            //     q25: 'A',
            //     q26: 'C',
            //     q27: 'B',
            //     q28: 'B',
            //     q29: 'D',
            //     q30: 'B',
            //     q31: 'B',
            //     q32: '',
            //     q33: 'C',
            //     q34: 'B',
            //     q35: '',
            //     q36: '',
            //     q37: '',
            //     q38: 'C',
            //     q39: '',
            //     q40: '',
            //     q41: 'B',
            //     q42: 'C',
            //     q43: 'C',
            //     q44: 'A',
            //     q45: '',
            //     q46: 'B',
            //     q47: '',
            //     q48: '',
            //     q49: '',
            //     q50: 'A',
            //     q51: 'D',
            //     q52: '',
            //     q53: '',
            //     q54: '',
            //     q55: '',
            //     q56: 'A',
            //     q57: 'C',
            //     q58: 'C',
            //     q59: '',
            //     q60: '',
            //     q61: 'C',
            //     q62: 'B',
            //     q63: '',
            //     q64: '',
            //     q65: '',
            //     q66: '',
            //     q67: '',
            //     q68: '',
            //     q69: 'B',
            //     q70: 'A',
            //     q71: 'C',
            //     q72: '',
            //     q73: 'D',
            //     q74: 'C',
            //     q75: 'B',
            //     q76: 'D',
            //     q77: 'C',
            //     q78: '',
            //     q79: 'C',
            //     q80: '',
            //     q81: '',
            //     q82: '',
            //     q83: 'A',
            //     q84: '',
            //     q85: '',
            //     q86: '',
            //     q87: '',
            //     q88: '',
            //     q89: 'A',
            //     q90: 'B',
            //     q91: 'B',
            //     q92: 'D',
            //     q93: 'B',
            //     q94: '',
            //     q95: '',
            //     q96: 'A',
            //     q97: 'B',
            //     q98: 'C',
            //     q99: 'D',
            //     q100: 'D'
            // }
        });
    });

    // Sort by marks for ranking
    results.sort((a, b) => b.totalMark - a.totalMark);

    // Assign ranks
    results.forEach((result, index) => {
        result.rank = index + 1;
    });

    return results;


};

module.exports = { processQuestions };
