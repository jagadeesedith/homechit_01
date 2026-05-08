interface ChitSettings {
  startMonth: number;
  startYear: number;
  firstMonthAmount: number;
  monthlyAmount: number;
}

export function getMonthAmount(
  month: number,
  year: number,
  settings: ChitSettings
) {
  const isFirstMonth =
    month === settings.startMonth &&
    year === settings.startYear;

  return isFirstMonth
    ? settings.firstMonthAmount
    : settings.monthlyAmount;
}