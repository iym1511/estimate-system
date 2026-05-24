export interface QuoteForPDF {
  room_number: string;
  work_date: string;
  description: string;
  amount: number;
  remarks?: string;
}

export interface BuildingForPDF {
  name: string;
  address?: string;
}

async function savePDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // iOS Safari는 blob download 미지원 → 새 탭에서 PDF 뷰어 열기
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export async function generateEstimatePDF(quotes: QuoteForPDF[], building: BuildingForPDF): Promise<void> {
  const React = (await import('react')).default;
  const { pdf } = await import('@react-pdf/renderer');
  const { EstimateDocument } = await import('./pdf-templates');

  const element = React.createElement(EstimateDocument, { quotes, building });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(element as any).toBlob();
  await savePDF(blob, `견적서_${building.name}.pdf`);
}

export async function generateStatementPDF(quotes: QuoteForPDF[], building: BuildingForPDF): Promise<void> {
  const React = (await import('react')).default;
  const { pdf } = await import('@react-pdf/renderer');
  const { StatementDocument } = await import('./pdf-templates');

  const element = React.createElement(StatementDocument, { quotes, building });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(element as any).toBlob();
  await savePDF(blob, `거래명세서_${building.name}.pdf`);
}
