document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap components
  const toastEl = document.getElementById('toast');
  const toast = new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 3000
  });
  
  const editModalEl = document.getElementById('editModal');
  const editModal = new bootstrap.Modal(editModalEl);
  
  // Main data and state
  // We'll extract the data from the attached HTML file
  let icdData = [
    {"kode_icd": "A00.0", "nama_icd": "Cholera due to Vibrio cholerae 01, biovar cholerae", "nama_icd_indo": "Kolera disebabkan Vibrio cholerae 01, biovar cholerae ", "bahasa_lain": ""},
    {"kode_icd": "A00.1", "nama_icd": "Cholera due to Vibrio cholerae 01, biovar eltor", "nama_icd_indo": "Kolera disebabkan Vibrio cholerae 01, biovar eltor ", "bahasa_lain": ""},
    {"kode_icd": "A00.9", "nama_icd": "Cholera, unspecified", "nama_icd_indo": "Kolera, yang tidak spesifik", "bahasa_lain": ""}
    // We'll get the complete data from the attached file
  ];

  // Extract data from the attached HTML file
  fetch('attached_assets/ICD_FINAL_MODERN_CLEAN.html')
    .then(response => response.text())
    .then(html => {
      // Extract ICD data from the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const scriptTags = tempDiv.querySelectorAll('script');
      
      scriptTags.forEach(script => {
        const content = script.textContent;
        if (content && content.includes('const icdData = [')) {
          const dataStartIndex = content.indexOf('const icdData = [');
          if (dataStartIndex !== -1) {
            let dataString = content.substring(dataStartIndex);
            dataString = dataString.substring(dataString.indexOf('['), dataString.indexOf(';'));
            try {
              const parsedData = JSON.parse(dataString);
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                icdData = parsedData;
                // Check localStorage
                const storedData = localStorage.getItem('icdData');
                if (storedData) {
                  try {
                    const storedParsed = JSON.parse(storedData);
                    if (Array.isArray(storedParsed) && storedParsed.length > 0) {
                      icdData = storedParsed;
                    }
                  } catch (err) {
                    console.error('Failed to parse stored data:', err);
                  }
                }
                // Now render the table with data
                filteredData = [...icdData];
                renderTable(filteredData, currentPage);
              }
            } catch (err) {
              console.error('Failed to parse ICD data:', err);
            }
          }
        }
      });
    })
    .catch(err => {
      console.error('Failed to fetch ICD data:', err);
      // Try to load data from localStorage
      const storedData = localStorage.getItem('icdData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            icdData = parsedData;
            filteredData = [...icdData];
            renderTable(filteredData, currentPage);
          }
        } catch (err) {
          console.error('Failed to parse stored data:', err);
        }
      }
    });
  
  // Try to load data from localStorage
  const storedData = localStorage.getItem('icdData');
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        icdData = parsedData;
      }
    } catch (err) {
      console.error('Failed to parse stored data:', err);
    }
  }
  
  let filteredData = [...icdData];
  let currentPage = 1;
  const rowsPerPage = 10;
  let currentEditIndex = null;
  
  // DOM Elements
  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');
  const darkModeBtn = document.getElementById('darkModeBtn');
  const resetDataBtn = document.getElementById('resetDataBtn');
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  const importFile = document.getElementById('importFile');
  const saveToFileBtn = document.getElementById('saveToFileBtn');
  const printBtn = document.getElementById('printBtn');
  const saveModalBtn = document.getElementById('saveModalBtn');
  const csvExportBtn = document.getElementById('csvExportBtn');
  
  // Function to render table data
  function renderTable(data, page) {
    tableBody.innerHTML = '';
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginated = data.slice(start, end);
    
    if (paginated.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="5" class="text-center py-4">
          <div class="alert alert-info mb-0">
            <i class="fas fa-info-circle me-2"></i>Tidak ada data yang ditemukan
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    } else {
      paginated.forEach((item, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><span class="badge bg-primary">${item.kode_icd}</span></td>
          <td>${item.nama_icd_indo || '-'}</td>
          <td>${item.nama_icd || '-'}</td>
          <td>${item.bahasa_lain || '-'}</td>
          <td class="text-center">
            <button class="btn btn-warning btn-sm btn-edit" data-index="${start + i}">
              <i class="fas fa-edit me-1"></i>Edit
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
    
    // Update pagination info
    const totalPages = Math.ceil(data.length / rowsPerPage);
    pageInfo.textContent = `Halaman ${page} dari ${totalPages || 1}`;
    prevBtn.disabled = page === 1;
    nextBtn.disabled = end >= data.length;
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        openModal(index);
      });
    });
  }
  
  // Function to show toast notification
  function showToast(message, bgColor = '#198754') {
    const toastEl = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    
    // Determine toast color class
    let colorClass = 'bg-success';
    if (bgColor === '#e74c3c') colorClass = 'bg-danger';
    if (bgColor === '#f39c12') colorClass = 'bg-warning';
    if (bgColor === '#2980b9' || bgColor === '#3498db') colorClass = 'bg-info';
    
    toastEl.classList.add(colorClass);
    const bsToast = bootstrap.Toast.getInstance(toastEl);
    bsToast.show();
  }
  
  // Function to toggle dark mode
  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    showToast(`Mode gelap ${isDarkMode ? 'aktif' : 'nonaktif'}`);
    
    // Update button icon and text
    if (isDarkMode) {
      darkModeBtn.innerHTML = '<i class="fas fa-sun me-1"></i> Mode Terang';
    } else {
      darkModeBtn.innerHTML = '<i class="fas fa-moon me-1"></i> Mode Gelap';
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
  }
  
  // Function to reset data
  function resetData() {
    localStorage.removeItem('icdData');
    showToast('Data berhasil direset', '#f39c12');
    setTimeout(() => location.reload(), 1500);
  }
  
  // Function to export to Excel
  function exportToExcel() {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredData || []);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ICD Data");
      XLSX.writeFile(workbook, "icd_data.xlsx");
      showToast("Data berhasil diekspor ke Excel");
    } catch (err) {
      console.error('Failed to export to Excel:', err);
      showToast("Gagal mengekspor data", "#e74c3c");
    }
  }
  
  // Function to import data
  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw "Format tidak valid";
        
        localStorage.setItem("icdData", JSON.stringify(imported));
        showToast("Data berhasil diimpor", "#2980b9");
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        console.error('Failed to import data:', err);
        showToast("Gagal impor data", "#e74c3c");
      }
    };
    reader.readAsText(file);
  }
  
  // Function to save to file
  function saveToFile() {
    try {
      const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "icd_data_edited.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Data berhasil disimpan ke file");
    } catch (err) {
      console.error('Failed to save to file:', err);
      showToast("Gagal menyimpan data", "#e74c3c");
    }
  }
  
  // Function to export to CSV
  function exportToCSV() {
    try {
      const rows = [["Kode ICD", "Nama ICD (Indonesia)", "Nama ICD (Inggris)", "Bahasa Lain"]];
      filteredData.forEach(x =>
        rows.push([x.kode_icd, x.nama_icd_indo, x.nama_icd, x.bahasa_lain || ""])
      );
      
      const csv = rows.map(e => e.map(v => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "icd_data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Data berhasil diekspor ke CSV");
    } catch (err) {
      console.error('Failed to export to CSV:', err);
      showToast("Gagal mengekspor data", "#e74c3c");
    }
  }
  
  // Function to open edit modal
  function openModal(index) {
    currentEditIndex = index;
    const item = filteredData[index];
    
    document.getElementById("modalKode").value = item.kode_icd;
    document.getElementById("modalIndo").value = item.nama_icd_indo || '';
    document.getElementById("modalInggris").value = item.nama_icd || '';
    document.getElementById("modalLain").value = item.bahasa_lain || '';
    
    editModal.show();
  }
  
  // Function to save modal edit
  function saveModalEdit() {
    if (currentEditIndex !== null) {
      filteredData[currentEditIndex].nama_icd_indo = document.getElementById("modalIndo").value;
      filteredData[currentEditIndex].nama_icd = document.getElementById("modalInggris").value;
      filteredData[currentEditIndex].bahasa_lain = document.getElementById("modalLain").value;
      
      // Update original data as well
      const originalIndex = icdData.findIndex(item => 
        item.kode_icd === filteredData[currentEditIndex].kode_icd);
      
      if (originalIndex !== -1) {
        icdData[originalIndex] = {...filteredData[currentEditIndex]};
      }
      
      // Save to localStorage
      localStorage.setItem('icdData', JSON.stringify(icdData));
      
      editModal.hide();
      renderTable(filteredData, currentPage);
      showToast("Data berhasil diperbarui");
    }
  }
  
  // Event listeners
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase();
    filteredData = icdData.filter(item =>
      item.kode_icd.toLowerCase().includes(keyword) ||
      (item.nama_icd_indo && item.nama_icd_indo.toLowerCase().includes(keyword)) ||
      (item.nama_icd && item.nama_icd.toLowerCase().includes(keyword)) ||
      (item.bahasa_lain && item.bahasa_lain.toLowerCase().includes(keyword))
    );
    currentPage = 1;
    renderTable(filteredData, currentPage);
  });
  
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable(filteredData, currentPage);
    }
  });
  
  nextBtn.addEventListener('click', () => {
    if ((currentPage * rowsPerPage) < filteredData.length) {
      currentPage++;
      renderTable(filteredData, currentPage);
    }
  });
  
  darkModeBtn.addEventListener('click', toggleDarkMode);
  resetDataBtn.addEventListener('click', resetData);
  exportExcelBtn.addEventListener('click', exportToExcel);
  importFile.addEventListener('change', importData);
  saveToFileBtn.addEventListener('click', saveToFile);
  printBtn.addEventListener('click', () => window.print());
  saveModalBtn.addEventListener('click', saveModalEdit);
  csvExportBtn.addEventListener('click', exportToCSV);
  
  // Initialize the application
  renderTable(filteredData, currentPage);
  
  // Check if dark mode was previously enabled
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    darkModeBtn.innerHTML = '<i class="fas fa-sun me-1"></i> Mode Terang';
  }
});