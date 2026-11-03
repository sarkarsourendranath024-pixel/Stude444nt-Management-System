(() => {
  const STORAGE_KEY = 'student-management-records';
  const form = document.getElementById('studentForm');
  const rows = document.getElementById('studentRows');
  const search = document.getElementById('search');

  let students = [];
  let editingId = null;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) students = saved;
  } catch (error) {
    students = [];
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (error) {
      document.getElementById('message').textContent =
        'Could not save in this browser. Try opening this page in a regular browser window.';
    }
  }

  function safe(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function render() {
    const query = search.value.trim().toLowerCase();

    const filtered = students.filter(student =>
      [
        student.name,
        student.roll,
        student.phone,
        student.stream,
        student.registration
      ].some(value => value.toLowerCase().includes(query))
    );

    rows.innerHTML = filtered.map(student => `
      <tr>
        <td>${safe(student.name)}</td>
        <td>${safe(student.roll)}</td>
        <td>${safe(student.phone)}</td>
        <td>${safe(student.stream)}</td>
        <td>${safe(student.registration)}</td>
        <td>
          <div class="actions">
            <button
              type="button"
              class="edit"
              data-edit="${safe(student.id)}"
            >Edit</button>
            <button
              type="button"
              class="delete"
              data-delete="${safe(student.id)}"
            >Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    document.getElementById('count').textContent = students.length;
    document.getElementById('empty').hidden = filtered.length > 0;
  }

  function resetForm() {
    form.reset();
    editingId = null;
    document.getElementById('formTitle').textContent = 'Add a student';
    document.getElementById('saveButton').textContent = 'Add student';
    document.getElementById('cancelButton').hidden = true;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    const data = new FormData(form);
    const student = {
      name: data.get('name').trim(),
      roll: data.get('roll').trim(),
      phone: data.get('phone').trim(),
      stream: data.get('stream'),
      registration: data.get('registration').trim()
    };

    const duplicate = students.find(item =>
      item.id !== editingId &&
      (
        item.roll.toLowerCase() === student.roll.toLowerCase() ||
        item.registration.toLowerCase() === student.registration.toLowerCase()
      )
    );

    if (duplicate) {
      document.getElementById('message').textContent =
        'Roll number and registration number must be unique.';
      return;
    }

    if (editingId) {
      students = students.map(item =>
        item.id === editingId ? { ...item, ...student } : item
      );
      document.getElementById('message').textContent = 'Student updated.';
    } else {
      student.id = String(Date.now()) + Math.random().toString(16).slice(2);
      students.push(student);
      document.getElementById('message').textContent = 'Student added.';
    }

    saveToStorage();
    resetForm();
    render();
  });

  document.getElementById('cancelButton')
    .addEventListener('click', resetForm);

  search.addEventListener('input', render);

  rows.addEventListener('click', event => {
    const id = event.target.dataset.edit || event.target.dataset.delete;
    if (!id) return;

    const student = students.find(item => item.id === id);
    if (!student) return;

    if (event.target.dataset.edit) {
      editingId = id;

      form.elements.name.value = student.name;
      form.elements.roll.value = student.roll;
      form.elements.phone.value = student.phone;
      form.elements.stream.value = student.stream;
      form.elements.registration.value = student.registration;

      document.getElementById('formTitle').textContent = 'Edit student';
      document.getElementById('saveButton').textContent = 'Save changes';
      document.getElementById('cancelButton').hidden = false;
      document.getElementById('name').focus();
    } else if (confirm('Delete ' + student.name + '?')) {
      students = students.filter(item => item.id !== id);
      saveToStorage();
      render();
      document.getElementById('message').textContent = 'Student deleted.';
    }
  });

  document.getElementById('exportButton')
    .addEventListener('click', () => {
      if (!students.length) {
        document.getElementById('message').textContent =
          'There are no students to export yet.';
        return;
      }

      const header = [
        'Name',
        'Roll number',
        'Phone number',
        'Stream',
        'Registration number'
      ];

      const csv = [
        header,
        ...students.map(student => [
          student.name,
          student.roll,
          student.phone,
          student.stream,
          student.registration
        ])
      ]
        .map(line =>
          line.map(value => '"' + value.replace(/"/g, '""') + '"').join(',')
        )
        .join('\r\n');

      const file = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8'
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = 'students.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    });

  render();
})();
