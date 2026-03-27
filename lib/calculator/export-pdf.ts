import { totalAddressesFromCidr, type VlsmAllocation } from "@/lib/vlsm"

type ExportVlsmPdfArgs = {
  results: VlsmAllocation[]
  baseNetwork: string
  baseCidr: string
}

export async function exportVlsmPdf({ results, baseNetwork, baseCidr }: ExportVlsmPdfArgs) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])

  const document = new jsPDF({ unit: "pt", format: "a4" })
  const createdAt = new Date().toLocaleString()

  document.setFontSize(16)
  document.text("Subnify VLSM Report", 40, 44)
  document.setFontSize(10)
  document.text(`Generated: ${createdAt}`, 40, 62)
  document.text(`Base Network: ${baseNetwork}/${baseCidr}`, 40, 76)

  autoTable(document, {
    startY: 96,
    head: [["Subnet", "Network", "CIDR", "Mask", "Host Range", "Broadcast", "Usable"]],
    body: results.map((row) => [
      row.name,
      row.networkAddress,
      `/${row.cidr}`,
      row.subnetMask,
      `${row.firstHost} - ${row.lastHost}`,
      row.broadcast,
      String(row.usableHosts),
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [30, 41, 59] },
  })

  const tableEnd = (document as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 96
  const pageHeight = document.internal.pageSize.getHeight()
  if (tableEnd + 150 > pageHeight) {
    document.addPage()
  }

  const chartStartY = tableEnd + 36 > pageHeight - 120 ? 56 : tableEnd + 36
  if (chartStartY === 56) {
    document.setFontSize(16)
    document.text("Subnify VLSM Report (cont.)", 40, 40)
  }

  document.setFontSize(12)
  document.text("Address Space Visualization", 40, chartStartY)

  const totalAddresses = totalAddressesFromCidr(baseCidr)
  const allocatedAddresses = results.reduce((sum, row) => sum + row.blockSize, 0)
  const barX = 40
  const barY = chartStartY + 16
  const barWidth = 515
  const barHeight = 24

  document.setDrawColor(148, 163, 184)
  document.setFillColor(248, 250, 252)
  document.rect(barX, barY, barWidth, barHeight, "FD")

  const palette: Array<[number, number, number]> = [
    [59, 130, 246],
    [16, 185, 129],
    [245, 158, 11],
    [168, 85, 247],
    [236, 72, 153],
    [14, 165, 233],
  ]

  results.forEach((row, index) => {
    const left = barX + (row.startOffset / totalAddresses) * barWidth
    const width = Math.max(1, (row.blockSize / totalAddresses) * barWidth)
    const [red, green, blue] = palette[index % palette.length]
    document.setFillColor(red, green, blue)
    document.rect(left, barY, width, barHeight, "F")

    if (width > 56) {
      document.setTextColor(255, 255, 255)
      document.setFontSize(8)
      document.text(`${row.name} /${row.cidr}`, left + 3, barY + 15)
    } else if (width > 24) {
      document.setTextColor(255, 255, 255)
      document.setFontSize(8)
      document.text(`/${row.cidr}`, left + 3, barY + 15)
    }
  })

  if (allocatedAddresses < totalAddresses) {
    const left = barX + (allocatedAddresses / totalAddresses) * barWidth
    const width = ((totalAddresses - allocatedAddresses) / totalAddresses) * barWidth
    document.setFillColor(226, 232, 240)
    document.rect(left, barY, width, barHeight, "F")
  }

  document.setTextColor(15, 23, 42)
  document.setFontSize(9)
  document.text(
    `Allocated: ${allocatedAddresses.toLocaleString()} / ${totalAddresses.toLocaleString()} addresses`,
    40,
    barY + 44
  )

  document.save(`subnify-vlsm-${Date.now()}.pdf`)
}
