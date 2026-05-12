// src/core/services/ReportGenerator.ts
export interface IRouteReport {
  objectName: string;
  objectType?: string;      // опционально
  address?: string;         // опционально
  time: string;
  distance: string;
  timestamp?: string;       // опционально
  shareLink: string;
}

export class ReportGenerator {
  static formatReport(report: IRouteReport): string {
    return `
      📍 <b>Объект:</b> ${report.objectName}${report.objectType ? ` (${report.objectType})` : ''}<br/>
      ${report.address ? `🏛️ <b>Адрес:</b> ${report.address}<br/>` : ''}
      ⏱️ <b>Время в пути:</b> ${report.time}<br/>
      🚶 <b>Расстояние:</b> ${report.distance}<br/>
      ${report.timestamp ? `📅 <b>Дата анализа:</b> ${report.timestamp}<br/>` : ''}
    `;
  }

  static generateExportLink(from: [number, number], to: [number, number]): string {
    return `https://yandex.ru/maps/?rtext=${from[0]},${from[1]}~${to[0]},${to[1]}&rtt=pedestrian`;
  }

  static exportToCSV(reports: IRouteReport[]): void {
    const headers = ['Объект', 'Тип', 'Адрес', 'Время', 'Расстояние', 'Ссылка'];
    const rows = reports.map(r => 
      [`"${r.objectName}"`, r.objectType || '', `"${r.address || ''}"`, r.time, r.distance, r.shareLink].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gis_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}