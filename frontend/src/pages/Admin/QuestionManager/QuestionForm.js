import React, { useEffect, useRef, useState } from 'react';
import { getDefaultPrompt, getRequiredQuestionCount, normalizeQuestionCount, createEmptyQuestion } from './utils';

const QuestionForm = ({
  isModalOpen,
  editingId,
  form,
  setForm,
  tags,
  isLoading,
  onClose,
  onSave
}) => {
  const textareaRefs = useRef({});
  const [activeField, setActiveField] = useState('');

  const updateFormFieldValue = (fieldKey, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        questions: prev.questions.map((question) => ({
          ...question,
          answers: question.answers.map((answer) => ({ ...answer }))
        }))
      };

      if (fieldKey === 'passage') {
        next.passage = value;
        return next;
      }

      const parts = fieldKey.split('.');
      if (parts[0] !== 'questions') return next;

      const questionIndex = Number(parts[1]);
      const questionItem = { ...next.questions[questionIndex], answers: next.questions[questionIndex].answers.map((answer) => ({ ...answer })) };

      if (parts[2] === 'question') {
        questionItem.question = value;
      } else if (parts[2] === 'answers') {
        const answerIndex = Number(parts[3]);
        const field = parts[4];
        questionItem.answers[answerIndex] = { ...questionItem.answers[answerIndex], [field]: value };
      }

      next.questions[questionIndex] = questionItem;
      return next;
    });
  };

  const applyFormatting = (type) => {
    const fieldKey = activeField;
    const fieldRef = textareaRefs.current[fieldKey];
    if (!fieldRef) return;

    fieldRef.focus();
    if (type === 'bold') {
      document.execCommand('bold', false, null);
    } else if (type === 'italic') {
      document.execCommand('italic', false, null);
    } else if (type === 'underline') {
      document.execCommand('underline', false, null);
    } else if (type === 'center') {
      // Toggle: nếu đã căn giữa thì chuyển về căn trái
      const isCentered = document.queryCommandState('justifyCenter');
      document.execCommand(isCentered ? 'justifyLeft' : 'justifyCenter', false, null);
    } else if (type === 'tab') {
      document.execCommand('insertHTML', false, '&emsp;');
    } else if (type === 'blank') {
      document.execCommand('insertHTML', false, '[BLANK]');
    }

    window.requestAnimationFrame(() => {
      const html = fieldRef.innerHTML;
      updateFormFieldValue(fieldKey, html === '<br>' ? '' : html);
    });
  };

  // Xử lý paste: giữ bold, italic, underline; loại bỏ font-family, font-size
  const handlePaste = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    let html = clipboardData.getData('text/html');

    if (html) {
      // Dùng DOMParser để xử lý HTML an toàn
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Duyệt tất cả element, chuyển CSS formatting thành thẻ HTML
      const processNode = (node) => {
        if (node.nodeType !== 1) return; // Chỉ xử lý element nodes

        const style = node.style;

        // Chuyển font-weight: bold/700/800/900 → bọc nội dung trong <b>
        if (style.fontWeight && (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700)) {
          const b = doc.createElement('b');
          while (node.firstChild) b.appendChild(node.firstChild);
          node.appendChild(b);
          style.removeProperty('font-weight');
        }

        // Chuyển font-style: italic → bọc nội dung trong <i>
        if (style.fontStyle === 'italic') {
          const i = doc.createElement('i');
          while (node.firstChild) i.appendChild(node.firstChild);
          node.appendChild(i);
          style.removeProperty('font-style');
        }

        // Chuyển text-decoration: underline → bọc nội dung trong <u>
        if (style.textDecoration && style.textDecoration.includes('underline')) {
          const u = doc.createElement('u');
          while (node.firstChild) u.appendChild(node.firstChild);
          node.appendChild(u);
          style.removeProperty('text-decoration');
        }

        // Loại bỏ font-family, font-size
        style.removeProperty('font-family');
        style.removeProperty('font-size');

        // Loại bỏ style attribute nếu rỗng
        if (node.getAttribute('style') === '') {
          node.removeAttribute('style');
        }

        // Xử lý đệ quy cho các phần tử con
        Array.from(node.children).forEach(processNode);
      };

      // Xử lý tất cả node trong body
      Array.from(doc.body.children).forEach(processNode);

      // Loại bỏ thẻ <font>
      doc.body.querySelectorAll('font').forEach(fontEl => {
        const frag = doc.createDocumentFragment();
        while (fontEl.firstChild) frag.appendChild(fontEl.firstChild);
        fontEl.parentNode.replaceChild(frag, fontEl);
      });

      const cleanHtml = doc.body.innerHTML;
      document.execCommand('insertHTML', false, cleanHtml);
    } else {
      const text = clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    }

    // Cập nhật form state
    const fieldKey = activeField;
    const fieldRef = textareaRefs.current[fieldKey];
    if (fieldRef) {
      window.requestAnimationFrame(() => {
        const content = fieldRef.innerHTML;
        updateFormFieldValue(fieldKey, content === '<br>' ? '' : content);
      });
    }
  };

  const setCorrectAnswer = (questionIndex, answerIndex) => {
    setForm((prev) => {
      const questionsCopy = [...prev.questions];
      questionsCopy[questionIndex] = {
        ...questionsCopy[questionIndex],
        answers: questionsCopy[questionIndex].answers.map((ans, idx) => ({
          ...ans,
          isCorrect: idx === answerIndex
        }))
      };
      return { ...prev, questions: questionsCopy };
    });
  };

  const handleAnswerFieldChange = (questionIndex, answerIndex, field, value) => {
    setForm((prev) => {
      const questionsCopy = [...prev.questions];
      const answersCopy = [...questionsCopy[questionIndex].answers];
      answersCopy[answerIndex] = { ...answersCopy[answerIndex], [field]: value };
      questionsCopy[questionIndex] = { ...questionsCopy[questionIndex], answers: answersCopy };
      return { ...prev, questions: questionsCopy };
    });
  };

  const updateQuestionTagSearch = (questionIndex, value) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex] = { ...questions[questionIndex], tagSearch: value };
      return { ...prev, questions };
    });
  };

  const getFieldHtml = (fieldKey) => {
    if (fieldKey === 'passage') return form.passage || '';

    const parts = fieldKey.split('.');
    if (parts[0] !== 'questions') return '';

    const questionIndex = Number(parts[1]);
    const questionItem = form.questions[questionIndex];
    if (!questionItem) return '';

    if (parts[2] === 'question') {
      return questionItem.question || '';
    }

    if (parts[2] === 'answers') {
      const answerIndex = Number(parts[3]);
      const answerItem = questionItem.answers[answerIndex];
      return answerItem ? answerItem[parts[4]] || '' : '';
    }

    return '';
  };

  useEffect(() => {
    Object.entries(textareaRefs.current).forEach(([fieldKey, el]) => {
      if (!el || activeField === fieldKey) return;
      const html = getFieldHtml(fieldKey);
      if (el.innerHTML !== html) {
        el.innerHTML = html;
      }
    });
  }, [form, activeField]);

  const toggleQuestionTag = (questionIndex, tagId) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      const questionItem = { ...questions[questionIndex] };
      const tagIds = questionItem.tagIds.includes(tagId)
        ? questionItem.tagIds.filter((id) => id !== tagId)
        : [...questionItem.tagIds, tagId];
      questions[questionIndex] = { ...questionItem, tagIds };
      return { ...prev, questions };
    });
  };

  const getFilteredTags = (search) => {
    const lowerSearch = search.toLowerCase();
    return tags.filter((tag) =>
      !lowerSearch ||
      tag.TagName.toLowerCase().includes(lowerSearch) ||
      (tag.SkillName && tag.SkillName.toLowerCase().includes(lowerSearch))
    );
  };

  const addQuestion = () => {
    setForm((prev) => ({ ...prev, questions: [...prev.questions, createEmptyQuestion()] }));
  };

  const removeQuestion = (questionIndex) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      if (questions.length <= 1) return prev;
      questions.splice(questionIndex, 1);
      return { ...prev, questions };
    });
  };

  const getVisibleQuestionCount = () => {
    if (!form.questionType) return form.questions.length || 0;
    return getRequiredQuestionCount(form.questionType);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Sửa đề bài' : 'Tạo đề bài mới'}</h3>
            <p className="text-sm text-gray-500">Nhập đầy đủ đề bài, passage, câu hỏi và đáp án cho từng loại.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">Đóng</button>
        </div>

        {/* Thanh công cụ format - sticky */}
        <div className="sticky top-0 z-10 bg-white px-6 pb-3 flex-shrink-0 border-b border-gray-100">
          <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting('bold')}
                className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                B
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting('italic')}
                className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                I
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting('underline')}
                className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                U
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting('center')}
                className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Center
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting('tab')}
                className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Tab
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting('blank')}
                className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                [BLANK]
              </button>
            </div>
            <div className="text-xs text-gray-500">Chọn ô nhập và nhấn nút để áp dụng định dạng HTML.</div>
          </div>
        </div>

        {/* Nội dung chính - cuộn được */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full rounded-3xl border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="Dễ">Dễ</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Khó">Khó</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại đề</label>
                <select
                  value={form.questionType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      questionType: type,
                      prompt: getDefaultPrompt(type),
                      questions: normalizeQuestionCount(prev.questions, getRequiredQuestionCount(type))
                    }));
                  }}
                  className="w-full rounded-3xl border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="Leaflet">Leaflet</option>
                  <option value="Ordering">Ordering</option>
                  <option value="Context_Filling">Context Filling</option>
                  <option value="Reading_8">Reading 8</option>
                  <option value="Reading_10">Reading 10</option>
                </select>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-700">
                <p className="text-xs text-gray-500">Đề bài tự động:</p>
                <div className="mt-2 rounded-2xl bg-white p-3 text-sm text-gray-700 border border-gray-200" dangerouslySetInnerHTML={{ __html: form.prompt }} />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đoạn văn</label>
                <div
                  ref={(el) => {
                    textareaRefs.current.passage = el;
                    if (el && activeField !== 'passage') {
                      el.innerHTML = form.passage || '';
                    }
                  }}
                  onFocus={() => setActiveField('passage')}
                  onBlur={() => setActiveField('')}
                  onPaste={handlePaste}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => updateFormFieldValue('passage', e.currentTarget.innerHTML)}
                  style={{ fontFamily: 'Arial, sans-serif', fontSize: '18px' }}
                  className="min-h-[150px] w-full rounded-3xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-pre-wrap break-words"
                />
                <p className="mt-2 text-xs text-gray-500">Dùng các nút In đậm, Nghiêng, Gạch chân, Căn giữa, Thụt lề để định dạng nội dung và xem trực quan. HTML chỉ lưu khi gửi.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4 gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">Các câu hỏi thành phần</h4>
                    <p className="text-sm text-gray-500">Tạo đáp án và gán tag cho từng câu hỏi.</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div>Số lượng: {getVisibleQuestionCount()}</div>
                    {form.questionType === 'Ordering' && (
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="rounded-3xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition"
                      >
                        Thêm câu hỏi
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-5">
                  {form.questions.map((questionItem, questionIndex) => {
                    const selectedTags = tags.filter((tag) => questionItem.tagIds.includes(tag.TagID));
                    return (
                      <div key={questionIndex} className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                        <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
                          <div className="space-y-4">
                            <div className="mb-4">
                              <div className="flex items-center justify-between gap-3">
                                <h5 className="font-semibold text-gray-800">Câu {questionIndex + 1}</h5>
                                <span className="text-xs text-gray-500">Chọn đúng 1 đáp án</span>
                              </div>
                              <div
                                ref={(el) => {
                                  textareaRefs.current[`questions.${questionIndex}.question`] = el;
                                  if (el && activeField !== `questions.${questionIndex}.question`) {
                                    el.innerHTML = questionItem.question || '';
                                  }
                                }}
                                onFocus={() => setActiveField(`questions.${questionIndex}.question`)}
                                onBlur={() => setActiveField('')}
                                onPaste={handlePaste}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => updateFormFieldValue(`questions.${questionIndex}.question`, e.currentTarget.innerHTML)}
                                style={{ fontFamily: 'Arial, sans-serif', fontSize: '18px' }}
                                className="mt-3 min-h-[60px] w-full rounded-3xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-pre-wrap break-words"
                                placeholder="Nội dung câu hỏi (có thể để trống cho Ordering)"
                              />
                            </div>
                            <div className="grid gap-3">
                              {questionItem.answers.map((answer, answerIndex) => (
                                <div key={answerIndex} className="grid grid-cols-12 gap-3 items-center">
                                  <div className="col-span-12 sm:col-span-1 flex justify-center">
                                    <input
                                      type="radio"
                                      name={`correct-${questionIndex}`}
                                      checked={answer.isCorrect}
                                      onChange={() => setCorrectAnswer(questionIndex, answerIndex)}
                                      className="h-4 w-4 text-indigo-600 border-gray-300"
                                    />
                                  </div>
                                  <div className="col-span-12 sm:col-span-5">
                                    <div className="text-xs font-semibold text-gray-600">Đáp án {answerIndex + 1}</div>
                                    <div
                                      ref={(el) => {
                                        textareaRefs.current[`questions.${questionIndex}.answers.${answerIndex}.content`] = el;
                                        if (el && activeField !== `questions.${questionIndex}.answers.${answerIndex}.content`) {
                                          el.innerHTML = answer.content || '';
                                        }
                                      }}
                                      onFocus={() => setActiveField(`questions.${questionIndex}.answers.${answerIndex}.content`)}
                                      onBlur={() => setActiveField('')}
                                      onPaste={handlePaste}
                                      contentEditable
                                      suppressContentEditableWarning
                                      onInput={(e) => handleAnswerFieldChange(questionIndex, answerIndex, 'content', e.currentTarget.innerHTML)}
                                      style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}
                                      className="mt-2 min-h-[60px] w-full rounded-3xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-pre-wrap break-words"
                                      placeholder={`Đáp án ${answerIndex + 1}`}
                                    />
                                  </div>
                                  <div className="col-span-12 sm:col-span-6">
                                    <div className="text-xs font-semibold text-gray-600">Giải thích</div>
                                    <div
                                      ref={(el) => {
                                        textareaRefs.current[`questions.${questionIndex}.answers.${answerIndex}.explanation`] = el;
                                        if (el && activeField !== `questions.${questionIndex}.answers.${answerIndex}.explanation`) {
                                          el.innerHTML = answer.explanation || '';
                                        }
                                      }}
                                      onFocus={() => setActiveField(`questions.${questionIndex}.answers.${answerIndex}.explanation`)}
                                      onBlur={() => setActiveField('')}
                                      onPaste={handlePaste}
                                      contentEditable
                                      suppressContentEditableWarning
                                      onInput={(e) => handleAnswerFieldChange(questionIndex, answerIndex, 'explanation', e.currentTarget.innerHTML)}
                                      style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}
                                      className="mt-2 min-h-[60px] w-full rounded-3xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-pre-wrap break-words"
                                      placeholder="Giải thích (tùy chọn)"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-3xl border border-gray-200 bg-white p-4">
                            <div className="flex items-center justify-between mb-3 gap-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Tag</label>
                                <p className="text-xs text-gray-500">Gán tag cho câu hỏi này</p>
                              </div>
                              {form.questionType === 'Ordering' && form.questions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(questionIndex)}
                                  className="text-sm text-red-600 hover:underline"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                            {selectedTags.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {selectedTags.map((tag) => (
                                  <span key={tag.TagID} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                                    {tag.TagName}
                                  </span>
                                ))}
                              </div>
                            )}
                            <input
                              value={questionItem.tagSearch}
                              onChange={(e) => updateQuestionTagSearch(questionIndex, e.target.value)}
                              placeholder="Tìm tag..."
                              className="w-full rounded-3xl border border-gray-300 px-4 py-3 outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <div className="mt-3 max-h-52 overflow-y-auto space-y-2 pr-1">
                              {getFilteredTags(questionItem.tagSearch).length === 0 ? (
                                <div className="text-sm text-gray-500">Không tìm thấy tag phù hợp.</div>
                              ) : (
                                getFilteredTags(questionItem.tagSearch).map((tag) => (
                                  <button
                                    key={tag.TagID}
                                    type="button"
                                    onClick={() => toggleQuestionTag(questionIndex, tag.TagID)}
                                    className={`w-full text-left rounded-3xl border px-4 py-3 transition ${questionItem.tagIds.includes(tag.TagID) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-slate-50'}`}
                                  >
                                    <div className="font-semibold">{tag.TagName}</div>
                                    {tag.SkillName && <div className="text-xs text-gray-400">{tag.SkillName}</div>}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nút hành động - sticky dưới cùng */}
        <div className="sticky bottom-0 z-10 bg-white px-6 py-4 border-t border-gray-200 flex-shrink-0 rounded-b-3xl">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-3xl border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100 transition"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isLoading}
              className={`rounded-3xl px-6 py-3 text-white ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isLoading ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Lưu đề bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;