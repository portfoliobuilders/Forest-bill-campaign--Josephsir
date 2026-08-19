/**
 * PDF letters stay off until Malayalam shapes correctly.
 *
 * pdf-lib + @pdf-lib/fontkit run OpenType GSUB (conjuncts / chillus look right
 * on isolated samples) but GPOS crashes on a hanging virama / chandrakkala
 * (`ക്`, `ക്ക്`, …). Real letters use those clusters constantly.
 *
 * Do not flip this to true without a shaping engine that handles Malayalam.
 */
export const PDF_LETTER_AVAILABLE = false
