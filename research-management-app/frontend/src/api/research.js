import client from './client';

// الحصول على جميع الأبحاث
export const getResearches = () => {
  return client.get('/research');
};

// الحصول على بحث محدد بواسطة المعرف
export const getResearchById = (id) => {
  return client.get(`/research/${id}`);
};

// الحصول على أبحاث المستخدم الحالي
export const getMyResearches = () => {
  return client.get('/research/me');
};

// الحصول على أبحاث المشرف
export const getSupervisorResearches = () => {
  return client.get('/research/supervisor');
};

// إنشاء بحث جديد
export const createResearch = (researchData) => {
  return client.post('/research', researchData);
};

// تحديث بحث
export const updateResearch = (id, researchData) => {
  return client.put(`/research/${id}`, researchData);
};

// حذف بحث
export const deleteResearch = (id) => {
  return client.delete(`/research/${id}`);
};

// مراجعة بحث (للمشرفين والمسؤولين)
export const reviewResearch = (id, reviewData) => {
  return client.post(`/research/${id}/review`, reviewData);
};

// إضافة ملاحظة إلى بحث
export const addResearchNote = (id, noteData) => {
  return client.post(`/research/${id}/notes`, noteData);
};

// تحميل ملف للبحث
export const uploadResearchFile = (id, fileData) => {
  const formData = new FormData();
  formData.append('file', fileData);
  
  return client.post(`/research/${id}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};