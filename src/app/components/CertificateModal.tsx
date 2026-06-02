// Req 35: Download certificate as PDF
import { useRef, useState } from 'react';
import { X, Download, Award, Loader2 } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  eventTitle: string;
  eventDate: string;
  studentId: string;
}

export function CertificateModal({
  isOpen,
  onClose,
  studentName,
  eventTitle,
  eventDate,
  studentId,
}: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const today = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setDownloading(true);

    try {
      // Dynamic imports to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-${studentId}-${eventTitle.slice(0, 15).replace(/\s/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('حدث خطأ أثناء تحميل الشهادة. يرجى المحاولة مرة أخرى.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-card rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-border flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">شهادة الحضور</h3>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 shadow-md shadow-primary/20"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  تحميل PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="p-6 bg-muted/20 overflow-auto flex-1">
          {/* The actual certificate that will be captured as PDF */}
          <div
            ref={certRef}
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              padding: '48px',
              fontFamily: 'Tajawal, Arial, sans-serif',
              direction: 'rtl',
            }}
          >
            {/* Outer border */}
            <div
              style={{
                border: '8px double #1E2652',
                padding: '32px',
                position: 'relative',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 50%, #f8f0ff 100%)',
              }}
            >
              {/* Inner border */}
              <div
                style={{
                  border: '2px solid #5C2D91',
                  padding: '28px',
                  position: 'relative',
                }}
              >
                {/* Corner decorations */}
                {[
                  { top: '-2px', right: '-2px', borderTop: '4px solid #00ADEF', borderRight: '4px solid #00ADEF', borderBottom: 'none', borderLeft: 'none' },
                  { top: '-2px', left: '-2px', borderTop: '4px solid #00ADEF', borderLeft: '4px solid #00ADEF', borderBottom: 'none', borderRight: 'none' },
                  { bottom: '-2px', right: '-2px', borderBottom: '4px solid #00ADEF', borderRight: '4px solid #00ADEF', borderTop: 'none', borderLeft: 'none' },
                  { bottom: '-2px', left: '-2px', borderBottom: '4px solid #00ADEF', borderLeft: '4px solid #00ADEF', borderTop: 'none', borderRight: 'none' },
                ].map((style, i) => (
                  <div key={i} style={{ position: 'absolute', width: '28px', height: '28px', ...style }} />
                ))}

                {/* University Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#1E2652', marginBottom: '4px', letterSpacing: '0.5px' }}>
                    جامعة الإمام محمد بن سعود الإسلامية
                  </div>
                  <div style={{ fontSize: '12px', color: '#5C2D91', fontWeight: 700, marginBottom: '16px' }}>
                    Imam Mohammad Ibn Saud Islamic University — Imamu TechVerse
                  </div>
                  <div
                    style={{
                      width: '60%',
                      margin: '0 auto',
                      height: '2px',
                      background: 'linear-gradient(to left, transparent, #5C2D91, #00ADEF, #5C2D91, transparent)',
                    }}
                  />
                </div>

                {/* Award Icon */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      width: '72px',
                      height: '72px',
                      background: 'linear-gradient(135deg, #1E2652 0%, #5C2D91 100%)',
                      borderRadius: '50%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(92,45,145,0.3)',
                    }}
                  >
                    <span style={{ fontSize: '36px' }}>🏆</span>
                  </div>
                </div>

                {/* Certificate Title */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      fontSize: '30px',
                      fontWeight: 900,
                      color: '#1E2652',
                      marginBottom: '8px',
                      letterSpacing: '1px',
                    }}
                  >
                    شهادة حضور وإتمام
                  </div>
                  <div
                    style={{
                      width: '40%',
                      margin: '0 auto',
                      height: '1px',
                      background: 'linear-gradient(to left, transparent, #8C61AF, transparent)',
                    }}
                  />
                </div>

                {/* Presented to */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', fontWeight: 500 }}>
                    تُمنح هذه الشهادة تقديراً وإجلالاً إلى
                  </div>
                  <div
                    style={{
                      fontSize: '26px',
                      fontWeight: 900,
                      color: '#5C2D91',
                      borderBottom: '2px dashed #8C61AF',
                      paddingBottom: '10px',
                      display: 'inline-block',
                      minWidth: '320px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {studentName}
                  </div>
                </div>

                {/* Event info */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>
                    وذلك لحضوره وإتمامه بنجاح فعالية
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 900,
                      color: '#1E2652',
                      marginBottom: '8px',
                      background: 'linear-gradient(135deg, #1E2652, #5C2D91)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {eventTitle}
                  </div>
                  <div style={{ fontSize: '14px', color: '#5C2D91', fontWeight: 700 }}>
                    📅 بتاريخ: {eventDate}
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderTop: '1px solid #e0d4f0',
                    paddingTop: '20px',
                    marginTop: '8px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '130px', borderBottom: '1px solid #555', marginBottom: '6px' }} />
                    <div style={{ fontSize: '11px', color: '#666' }}>توقيع عميد شؤون الطلاب</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '24px',
                        marginBottom: '4px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                      }}
                    >
                      🌟
                    </div>
                    <div style={{ fontSize: '11px', color: '#5C2D91', fontWeight: 700 }}>
                      رقم الطالب: {studentId}
                    </div>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                      تاريخ الإصدار: {today}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '130px', borderBottom: '1px solid #555', marginBottom: '6px' }} />
                    <div style={{ fontSize: '11px', color: '#666' }}>ختم الجامعة الرسمي</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
