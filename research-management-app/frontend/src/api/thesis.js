import client from './client';

// الحصول على جميع الأطروحات
export const getTheses = () => {
  return client.get('/thesis');
};

// الحصول على أطروحة محددة بواسطة المعرف
export const getThesisById = (id) => {
  return client.get(`/thesis/${id}`);
};

// الحصول على أطروحات المستخدم الحالي
export const getMyTheses = () => {
  return client.get('/thesis/me');
};

// الحصول على أطروحات المشرف
export const getSupervisorTheses = () => {
  return client.get('/thesis/supervisor');
};

// إنشاء أطروحة جديدة
export const createThesis = (thesisData) => {
  return client.post('/thesis', thesisData);
};

// تحديث أطروحة
export const updateThesis = (id, thesisData) => {
  return client.put(`/thesis/${id}`, thesisData);
};

// حذف أطروحة
export const deleteThesis = (id) => {
  return client.delete(`/thesis/${id}`);
};

// مراجعة أطروحة (للمشرفين والمسؤولين)
export const reviewThesis = (id, reviewData) => {
  return client.post(`/thesis/${id}/review`, reviewData);
};

// إضافة ملاحظة إلى أطروحة
export const addThesisNote = (id, noteData) => {
  return client.post(`/thesis/${id}/notes`, noteData);
};

// تحميل ملف للأطروحة
export const uploadThesisFile = (id, fileData) => {
  const formData = new FormData();
  formData.append('file', fileData);
  
  return client.post(`/thesis/${id}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// تحديث معلومات المناقشة
export const updateDefenseInfo = (id, defenseData) => {
  return client.post(`/thesis/${id}/defense`, defenseData);
};