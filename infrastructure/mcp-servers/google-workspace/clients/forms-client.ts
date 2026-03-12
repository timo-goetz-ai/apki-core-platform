import { getForms } from "../google-auth.js";

const forms = () => getForms();

export interface FormInfo {
  id: string;
  title: string;
  description: string;
  url: string;
  respondentUrl: string;
  questionCount: number;
}

export interface FormResponse {
  responseId: string;
  createTime: string;
  answers: Record<string, { questionId: string; value: string }>;
}

export async function getForm(formId: string): Promise<FormInfo> {
  const res = await forms().forms.get({ formId });
  return {
    id: res.data.formId!,
    title: res.data.info?.title || "",
    description: res.data.info?.description || "",
    url: res.data.linkedSheetId
      ? `https://docs.google.com/forms/d/${res.data.formId}`
      : `https://docs.google.com/forms/d/${res.data.formId}`,
    respondentUrl: res.data.responderUri || "",
    questionCount: (res.data.items || []).length,
  };
}

export async function getFormResponses(
  formId: string,
  pageSize = 50
): Promise<FormResponse[]> {
  const res = await forms().forms.responses.list({
    formId,
    pageSize,
  });

  return (res.data.responses || []).map((r: any) => {
    const answers: Record<string, { questionId: string; value: string }> = {};
    for (const [qId, answer] of Object.entries(r.answers || {})) {
      const a = answer as any;
      const textAnswers = a.textAnswers?.answers || [];
      answers[qId] = {
        questionId: qId,
        value: textAnswers.map((t: any) => t.value).join(", "),
      };
    }
    return {
      responseId: r.responseId,
      createTime: r.createTime,
      answers,
    };
  });
}

export async function createForm(title: string): Promise<FormInfo> {
  const res = await forms().forms.create({
    requestBody: {
      info: { title },
    },
  });

  return {
    id: res.data.formId!,
    title: res.data.info?.title || title,
    description: "",
    url: `https://docs.google.com/forms/d/${res.data.formId}`,
    respondentUrl: res.data.responderUri || "",
    questionCount: 0,
  };
}

export async function addQuestion(
  formId: string,
  title: string,
  type: "SHORT_ANSWER" | "PARAGRAPH" | "MULTIPLE_CHOICE" | "CHECKBOX" | "DROPDOWN",
  options?: string[]
): Promise<void> {
  const item: any = {
    title,
    questionItem: {
      question: {
        required: false,
      },
    },
  };

  if (type === "SHORT_ANSWER") {
    item.questionItem.question.textQuestion = { paragraph: false };
  } else if (type === "PARAGRAPH") {
    item.questionItem.question.textQuestion = { paragraph: true };
  } else if (type === "MULTIPLE_CHOICE" || type === "CHECKBOX" || type === "DROPDOWN") {
    const choiceType =
      type === "MULTIPLE_CHOICE"
        ? "RADIO"
        : type === "CHECKBOX"
          ? "CHECKBOX"
          : "DROP_DOWN";
    item.questionItem.question.choiceQuestion = {
      type: choiceType,
      options: (options || []).map((o) => ({ value: o })),
    };
  }

  await forms().forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          createItem: {
            item,
            location: { index: 0 },
          },
        },
      ],
    },
  });
}
