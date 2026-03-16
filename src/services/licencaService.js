
/**
 * Ativa licença
 */
export async function ativarLicenca(req, res) {

  const { licenseKey, machine_id } = req.body;

  const licenca = await prisma.license.findUnique({
    where: { licenseKey }
  });

  if (!licenca) {
    return res.json({ valid: false });
  }

  if (licenca.status !== "ativo") {
    return res.json({ valid: false });
  }

  /**
   * Primeira ativação
   */
  if (!licenca.machine_id) {

    await prisma.license.update({
      where: { licenseKey },
      data: {
        machine_id,
        ativadoEm: new Date()
      }
    });

  }

  if (licenca.machine_id !== machine_id) {
    return res.json({ valid: false });
  }

  res.json({
    valid: true
  });

}

/**
 * Validação simples
 */
export async function validarLicenca(prisma, chave_licenca, machine_id) {

  try {

    const licenca = await prisma.licenses.findUnique({
      where: {
        chave_licenca: chave_licenca,
        //machine_id: machine_id
      }
    });

    // 🚫 Licença não encontrada
    if (!licenca) {
      return {
        success: false,
        code: 404,
        message: "Licença não encontrada ou inválida",
        data: null
      };
    }

    // 🚫 Máquina diferente
    if (licenca.machine_id !== machine_id) {
      return {
        success: false,
        code: 403,
        message: "Licença não pertence a esta máquina",
        data: null
      };
    }

    // 🚫 Licença desativada
    if (licenca.status !== "ativo") {
      return {
        success: false,
        code: 403,
        message: "Licença inativa ou bloqueada",
        data: null
      };
    }

    console.log('Licença válida');
    // ✅ Licença válida
    return {
      success: true,
      code: 200,
      message: "Licença válida",
      data: {
        chave_licenca: licenca.chave_licenca,
        machine_id: licenca.machine_id,
        status: licenca.status
      }
    };

  } catch (error) {

    console.error("Erro ao validar licença:", error);

    return {
      success: false,
      code: 500,
      message: "Erro interno ao validar licença",
      error: error.message
    };

  }

}